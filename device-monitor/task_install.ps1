# ================= 请修改这里 =================
# 注意：这里现在指向你的 .vbs 文件，不是 .ps1 了！
$VbsPath = "E:\合作\天格会相关\CLUB\RunHidden.vbs"  
$TaskName = "TFA_Device_Monitor"
# ===========================================

# 1. 检查文件是否存在
if (-not (Test-Path $VbsPath)) {
    Write-Host "错误：找不到启动器文件 $VbsPath" -ForegroundColor Red
    Write-Host "请确认路径是否正确，且 RunHidden.vbs 已放在该目录下。" -ForegroundColor Yellow
    Read-Host "按回车退出"
    exit
}

Write-Host "正在创建计划任务..." -ForegroundColor Cyan

# 2. 定义操作：运行 wscript.exe 来执行 .vbs
# wscript.exe 是 Windows 脚本宿主，本身就不会显示控制台窗口
$Action = New-ScheduledTaskAction -Execute "wscript.exe" `
    -Argument "`"$VbsPath`""

# 3. 定义触发器：用户登录时
$Trigger = New-ScheduledTaskTrigger -AtLogon

# 4. 定义设置
$Settings = New-ScheduledTaskSettingsSet `
    -StartWhenAvailable `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -Hidden `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 1) # 如果脚本崩了，1分钟后自动重启

# 5. 【关键】定义安全主体：强制使用 "不管用户是否登录都运行"
# 这样才能真正完全隐藏窗口
$Principal = New-ScheduledTaskPrincipal `
    -UserId "SYSTEM" `
    -LogonType ServiceAccount `
    -RunLevel Highest

# 6. 注册任务（如果存在则覆盖）
Register-ScheduledTask -TaskName $TaskName `
    -Action $Action `
    -Trigger $Trigger `
    -Settings $Settings `
    -Principal $Principal `
    -Force | Out-Null

Write-Host "========================================" -ForegroundColor Green
Write-Host "  ? 安装成功！" -ForegroundColor Green
Write-Host "  任务名称: $TaskName"
Write-Host "  启动器:   $VbsPath"
Write-Host "========================================"
Write-Host ""
Write-Host "提示：" -ForegroundColor Cyan
Write-Host "1. 任务已设置为使用 SYSTEM 账户运行，完全无窗口。"
Write-Host "2. 你可以右键点击任务栏 -> 任务管理器 -> 详细信息，查看是否有 powershell.exe 运行。"
Write-Host ""
Read-Host "按回车退出"