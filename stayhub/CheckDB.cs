using System;
using System.Data.SqlClient;

class Program
{
    static void Main()
    {
        string connStr = "Server=.\\SQLEXPRESS;Database=StayHub_SystemDb;Integrated Security=True;";
        using (SqlConnection conn = new SqlConnection(connStr))
        {
            conn.Open();
            using (SqlCommand cmd = new SqlCommand("SELECT SettingValue FROM SystemSettings WHERE SettingKey = 'PrivacyPolicy'", conn))
            {
                string val = (string)cmd.ExecuteScalar();
                Console.WriteLine(val.Substring(0, Math.Min(200, val.Length)));
            }
        }
    }
}
