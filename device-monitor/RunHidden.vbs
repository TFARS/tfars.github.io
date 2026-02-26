Set objShell = CreateObject("WScript.Shell")
' 下面这一行 0 代表完全隐藏窗口
objShell.Run "powershell.exe -NoProfile -ExecutionPolicy Bypass -File ""E:\合作\天格会相关\CLUB\device_update.ps1""", 0
Set objShell = Nothing