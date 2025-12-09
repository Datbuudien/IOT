import serial
import time
import os
import numpy as np

# --- CẤU HÌNH (SỬA LẠI CHO ĐÚNG MÁY BẠN) ---
SERIAL_PORT = 'COM3'   # <--- THAY ĐỔI CỔNG COM CỦA BẠN (Ví dụ: COM3, COM4, /dev/ttyUSB0)
BAUD_RATE = 921600     # <--- Tốc độ baud cực cao để truyền 16000 samples/giây (Phải khớp với ESP32)
SAMPLE_RATE = 16000    # Tần số lấy mẫu (Hz)
DURATION = 1.0         # <--- THAY ĐỔI THỜI GIAN THU TẠI ĐÂY (Ví dụ 1 giây)
OUTPUT_FOLDER = "dataset_long"

# --- CHẾ ĐỘ XỬ LÝ ---
# "RAW": Lưu giá trị ADC nguyên bản (0-4095) - TỐT CHO ESP32 INFERENCE
#        Model train với RAW → ESP32 inference với RAW → Nhất quán hoàn toàn!
# "PREPROCESSED": Xử lý cơ bản (DC offset removal, normalize) - Cho training trên PC
PROCESSING_MODE = "RAW"  # <--- KHUYẾN NGHỊ: "RAW" nếu model chạy trên ESP32

# --- ĐỊNH DẠNG LƯU TRỮ ---
# "TXT": Lưu dạng text, mỗi dòng một giá trị
# "BIN": Lưu dạng binary, mỗi giá trị 2 bytes (int16)
FILE_FORMAT = "TXT"  # <--- THAY ĐỔI: "TXT" hoặc "BIN"

# Tạo thư mục lưu trữ nếu chưa có
if not os.path.exists(OUTPUT_FOLDER):
    os.makedirs(OUTPUT_FOLDER)

# Các nhãn cần thu
LABELS = ['on', 'off', 'noise']
for label in LABELS:
    os.makedirs(os.path.join(OUTPUT_FOLDER, label), exist_ok=True)

def record_audio(label, filename):
    print(f"🎙️  Đang thu âm '{label}'...", end='', flush=True)
    
    ser = None
    try:
        # Kết nối Serial với timeout
        ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=2)
        # Chờ ESP32 ổn định sau khi mở cổng Serial
        time.sleep(2) 
        
        # HANDSHAKE Step 1: Xóa sạch buffer để đảm bảo không có dữ liệu rác
        # Điều này rất quan trọng để đảm bảo dữ liệu training chất lượng cao
        ser.reset_input_buffer()
        ser.reset_output_buffer()
        time.sleep(0.1)
        while ser.in_waiting > 0:
            ser.read(ser.in_waiting)
            time.sleep(0.01)
        
        # HANDSHAKE Step 2: Gửi lệnh 'R' để bắt đầu thu
        # ESP32 sẽ bắt đầu đọc MAX4466 và gửi raw data ngay lập tức
        ser.write(b'R')
        ser.flush()  # Đảm bảo lệnh được gửi ngay
        
        # Chờ ESP32 bắt đầu gửi dữ liệu
        time.sleep(0.05)
        
    except Exception as e:
        print(f"\n❌ Lỗi cổng COM: {e}")
        if ser:
            ser.close()
        return

    raw_values = []
    num_samples_expected = int(SAMPLE_RATE * DURATION)  # Số mẫu mong đợi
    
    start_time = time.time()
    last_data_time = time.time()
    
    # Buffer để lưu dữ liệu chưa hoàn chỉnh
    buffer = b''
    
    # Thống kê để phát hiện lỗi
    invalid_count = 0  # Số giá trị không hợp lệ
    out_of_range_count = 0  # Số giá trị ngoài phạm vi ADC
    
    # Vòng lặp thu dữ liệu từ Serial
    # Thu trong thời gian DURATION (1 giây) - ESP32 sẽ gửi liên tục
    while len(raw_values) < num_samples_expected:
        # Timeout an toàn
        if time.time() - start_time > (DURATION + 3.0): 
             print(" -> Hết giờ (Timeout)!")
             break
        
        # Kiểm tra nếu không có dữ liệu trong 1 giây
        if time.time() - last_data_time > 1.0:
            print(" -> Không nhận được dữ liệu!")
            break

        try:
            # Đọc tất cả dữ liệu có sẵn trong buffer (đọc theo batch để nhanh hơn)
            if ser.in_waiting > 0:
                # Đọc tất cả dữ liệu có sẵn
                new_data = ser.read(ser.in_waiting)
                buffer += new_data
                last_data_time = time.time()
                
                # Xử lý buffer: tách các dòng (mỗi dòng là một giá trị)
                while b'\n' in buffer:
                    # Tìm vị trí ký tự xuống dòng đầu tiên
                    line_end = buffer.find(b'\n')
                    # Lấy dòng đầu tiên
                    line_bytes = buffer[:line_end]
                    # Xóa dòng đã xử lý khỏi buffer
                    buffer = buffer[line_end + 1:]
                    
                    # Giải mã và xử lý
                    try:
                        line_str = line_bytes.decode('utf-8', errors='ignore').strip()
                        # Chỉ nhận các giá trị số nguyên hợp lệ và trong phạm vi ADC (0-4095)
                        if line_str.isdigit():
                            val = int(line_str)
                            # Lọc các giá trị ngoài phạm vi hợp lệ (có thể là lỗi đọc Serial)
                            if 0 <= val <= 4095:
                                raw_values.append(val)
                                # Dừng nếu đã đủ mẫu
                                if len(raw_values) >= num_samples_expected:
                                    break
                            else:
                                out_of_range_count += 1
                        else:
                            invalid_count += 1
                    except:
                        # Bỏ qua dòng lỗi
                        invalid_count += 1
                        continue
            else:
                # Nếu không có dữ liệu, đợi một chút rồi thử lại (tránh CPU 100%)
                time.sleep(0.001)  # 1ms
                        
        except Exception as e:
            # Bỏ qua lỗi đọc và tiếp tục
            continue
            
    # HANDSHAKE Step 3: Gửi lệnh 'S' để dừng thu
    # ESP32 sẽ ngừng gửi dữ liệu ngay khi nhận 'S'
    try:
        ser.write(b'S')
        ser.flush()
        time.sleep(0.1)  # Chờ ESP32 xử lý lệnh dừng
    except:
        pass
    finally:
        if ser:
            ser.close()
    
    # Cắt bớt nếu thu thừa mẫu
    if len(raw_values) > num_samples_expected:
        raw_values = raw_values[:num_samples_expected]
    
    # Thông báo số mẫu thu được
    samples_received = len(raw_values)
    samples_expected = num_samples_expected
    percentage = (samples_received / samples_expected * 100) if samples_expected > 0 else 0
    
    if samples_received < samples_expected * 0.9:
        print(f" ⚠️  Cảnh báo: Chỉ thu được {samples_received}/{samples_expected} mẫu ({percentage:.1f}%)")
    else:
        print(f" Xong! ({samples_received}/{samples_expected} mẫu, {percentage:.1f}%)")
    
    # Hiển thị thống kê lỗi nếu có
    if invalid_count > 0 or out_of_range_count > 0:
        print(f" ⚠️  Phát hiện lỗi: {invalid_count} dòng không hợp lệ, {out_of_range_count} giá trị ngoài phạm vi ADC")
        if invalid_count > samples_received * 0.1 or out_of_range_count > samples_received * 0.1:
            print(f" ⚠️  CẢNH BÁO: Quá nhiều lỗi! Có thể do Serial baud rate quá cao hoặc cáp USB kém!")

    # --- KIỂM TRA DỮ LIỆU ---
    if len(raw_values) < 100: 
        print("❌ Thu được quá ít dữ liệu!")
        if ser:
            ser.write(b'S')
            ser.close()
        return 

    # --- XỬ LÝ DỮ LIỆU ---
    # Tính DC offset trước (dùng cho cả 2 mode)
    dc_offset = np.mean(raw_values) if len(raw_values) > 0 else 2048
    
    if PROCESSING_MODE == "RAW":
        # RAW: Lưu giá trị ADC nguyên bản (0-4095)
        # Đây là dữ liệu giống hệt với ESP32 sẽ nhận được khi inference
        data_to_save = raw_values
        data_type = "ADC nguyên bản (0-4095) - Giống ESP32 inference"
    else:
        # PREPROCESSED: Xử lý cơ bản cho training
        # Chuyển sang numpy array
        data = np.array(raw_values, dtype=np.float32)
        
        # 1. Loại bỏ DC offset (MAX4466 có DC offset ở ~VCC/2 = ~2048)
        data = data - dc_offset
        
        # 2. Normalize về range [-1, 1] hoặc [0, 1] để dễ train
        # Sử dụng range [-1, 1] vì phổ biến hơn cho audio
        max_abs = np.max(np.abs(data))
        if max_abs > 0:
            # Normalize về [-1, 1]
            data = data / max_abs
        else:
            data = data * 0
        
        # 3. Scale về int16 range [-32768, 32767] để lưu
        # Hoặc có thể lưu float32, nhưng int16 tiết kiệm dung lượng hơn
        data_int16 = (data * 32767).astype(np.int16)
        data_to_save = data_int16.tolist()
        data_type = "Đã xử lý (DC offset removed, normalized to int16)"
    
    # --- LƯU FILE ---
    try:
        if FILE_FORMAT == "TXT":
            # Lưu dạng text: mỗi dòng một giá trị
            with open(filename, 'w') as f:
                # Lưu metadata ở đầu file (cho RAW mode)
                if PROCESSING_MODE == "RAW":
                    f.write(f"# RAW ADC Data from ESP32\n")
                    f.write(f"# Sample Rate: {SAMPLE_RATE} Hz\n")
                    f.write(f"# Duration: {DURATION} s\n")
                    f.write(f"# DC Offset (avg): {dc_offset:.2f}\n")
                    f.write(f"# Format: ADC values (0-4095)\n")
                    f.write(f"# Total samples: {len(data_to_save)}\n")
                    f.write(f"# --- DATA START ---\n")
                for val in data_to_save:
                    f.write(f"{val}\n")
        else:  # BIN
            # Lưu dạng binary: mỗi giá trị 2 bytes
            with open(filename, 'wb') as f:
                # Lưu metadata ở đầu file (cho RAW mode)
                if PROCESSING_MODE == "RAW":
                    # Lưu header: 4 bytes cho số mẫu, 4 bytes cho DC offset (float)
                    import struct
                    f.write(struct.pack('<I', len(data_to_save)))  # uint32: số mẫu
                    f.write(struct.pack('<f', float(dc_offset)))  # float32: DC offset
                for val in data_to_save:
                    # Chuyển sang int16 và đảm bảo trong phạm vi
                    if PROCESSING_MODE == "RAW":
                        val_int = max(0, min(4095, int(val)))
                        f.write(val_int.to_bytes(2, byteorder='little', signed=False))
                    else:
                        val_int = max(-32768, min(32767, int(val)))
                        f.write(val_int.to_bytes(2, byteorder='little', signed=True))
        
        print(f"✅ Đã lưu: {filename} ({len(data_to_save)} mẫu, {data_type})")
        if PROCESSING_MODE == "RAW":
            print(f"   📊 DC Offset: {dc_offset:.2f} (có thể dùng để normalize khi train)")
    except Exception as e:
        print(f"❌ Lỗi lưu file: {e}")

# --- MENU CHÍNH ---
print(f"--- CÔNG CỤ THU DỮ LIỆU CHO ESP32 INFERENCE ({DURATION}s) ---")
print(f"📋 Chế độ xử lý: {PROCESSING_MODE}")
if PROCESSING_MODE == "RAW":
    print("   ✅ RAW: Giá trị ADC nguyên bản (0-4095)")
    print("   ✅ TỐT CHO ESP32: Train với RAW → Inference với RAW → Nhất quán!")
    print("   📝 Workflow: RAW data → Extract features → Train model → Deploy to ESP32")
    print("   💡 Tip: Có thể normalize trong model hoặc khi extract features")
else:
    print("   → PREPROCESSED: Đã xử lý cơ bản (DC offset removed, normalized)")
    print("   ⚠️  Lưu ý: Nếu model chạy trên ESP32, cần đảm bảo preprocessing giống nhau")
print(f"📋 Định dạng file: {FILE_FORMAT}")
if FILE_FORMAT == "TXT":
    print("   → Text: Mỗi dòng một giá trị (có metadata header)")
else:
    print("   → Binary: Mỗi giá trị 2 bytes (có metadata header)")
print()
while True:
    print("\nChọn nhãn để thu:")
    for i, lbl in enumerate(LABELS):
        # Đếm số file hiện có trong thư mục
        count = len(os.listdir(os.path.join(OUTPUT_FOLDER, lbl)))
        print(f"  {i+1}. {lbl} (Hiện có: {count})")
    print("  q. Thoát")
    
    choice = input("Nhập lựa chọn: ").strip()
    
    if choice == 'q':
        break
    
    try:
        idx = int(choice) - 1
        if 0 <= idx < len(LABELS):
            label = LABELS[idx]
            timestamp = int(time.time())
            extension = "txt" if FILE_FORMAT == "TXT" else "bin"
            filename = f"{OUTPUT_FOLDER}/{label}/{label}.{timestamp}.{extension}"
            
            print("3... 2... 1... NÓI!")
            time.sleep(0.5)
            record_audio(label, filename)
        else:
            print("❌ Lựa chọn không hợp lệ!")
    except ValueError:
        print("❌ Nhập sai!")

print("👋 Tạm biệt!")