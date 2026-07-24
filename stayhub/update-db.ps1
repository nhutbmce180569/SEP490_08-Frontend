$vi = 'Hoạt động như một "Hệ thống Quản lý Tour Thông minh", StayHub được thiết kế để các công ty du lịch quản lý hiệu quả tour, lịch trình, đặt chỗ, tương tác khách hàng và nội dung du lịch trong một hệ sinh thái thống nhất. Hệ thống tích hợp tính năng đề xuất tour bằng AI, quản lý lịch trình thông minh, mạng xã hội và vận hành đa vai trò nhằm tạo ra một trải nghiệm du lịch toàn diện và liền mạch. StayHub cũng cho phép các doanh nghiệp quản lý thông tin điểm đến như di sản văn hóa, đặc sản địa phương, ẩm thực truyền thống và các điểm du lịch để cung cấp nội dung phong phú và đáng tin cậy hơn cho khách hàng.'
$en = 'Operating as an "Intelligent Tour Management System", StayHub is designed for travel companies to efficiently manage tours, schedules, bookings, customer interactions, and tourism-related content within a unified ecosystem. The system integrates AI-powered tour recommendations, smart itinerary management, social interaction features, and multi-role operations to create a comprehensive and seamless travel experience. StayHub also enables businesses to manage destination information such as cultural heritage sites, local specialties, traditional foods, and tourist attractions to provide richer and more reliable travel content for customers.'

$connStr = "Server=.\SQLEXPRESS;Database=StayHub_SystemDb;Integrated Security=True;"
$conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
$conn.Open()

$cmdVi = $conn.CreateCommand()
$cmdVi.CommandText = "UPDATE SystemSettings SET SettingValue = @vi WHERE SettingKey = 'AboutUs'"
$cmdVi.Parameters.AddWithValue("@vi", $vi) | Out-Null
$cmdVi.ExecuteNonQuery()

$cmdEn = $conn.CreateCommand()
$cmdEn.CommandText = "UPDATE SystemSettings SET SettingValue = @en WHERE SettingKey = 'AboutUs_en'"
$cmdEn.Parameters.AddWithValue("@en", $en) | Out-Null
$cmdEn.ExecuteNonQuery()

$conn.Close()
Write-Host "Updated successfully"
