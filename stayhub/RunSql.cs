using System;
using System.IO;
using System.Data.SqlClient;

class Program
{
    static void Main()
    {
        string connStr = "Server=.\\SQLEXPRESS;Database=StayHub_SystemDb;Integrated Security=True;";
        string sqlPath = @"D:\HocDeKiCuoi\DoAn\SEP490_08-Frontend\stayhub\seed-real-upsert-with-layout.sql";
        string sql = File.ReadAllText(sqlPath, System.Text.Encoding.UTF8);
        
        using (SqlConnection conn = new SqlConnection(connStr))
        {
            conn.Open();
            // Split by GO or just execute the whole thing if no GO
            using (SqlCommand cmd = new SqlCommand(sql, conn))
            {
                cmd.ExecuteNonQuery();
            }
        }
        Console.WriteLine("DB Updated via C# successfully.");
    }
}
