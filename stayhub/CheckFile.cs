using System;
using System.IO;

class Program
{
    static void Main()
    {
        string sqlPath = @"D:\HocDeKiCuoi\DoAn\SEP490_08-Frontend\stayhub\seed-real-upsert-with-layout.sql";
        string sql = File.ReadAllText(sqlPath, System.Text.Encoding.UTF8);
        Console.WriteLine(sql.Substring(200, Math.Min(300, sql.Length - 200)));
    }
}
