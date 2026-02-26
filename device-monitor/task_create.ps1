# ================= 请修改这里 =================
$ScriptPath = "E:\合作\天格会相关\CLUB\device_update.ps1"  # 你的脚本存放位置
$TaskName = "TFA-DEVICES"          # 任务名称
# ===========================================

# 检查文件是否存在
if (-not (Test-Path $ScriptPath)) {
    Write-Host "错误：找不到脚本文件 $ScriptPath，请先修改路径！" -ForegroundColor Red
    Read-Host "按回车退出"
    exit
}

# 定义操作：启动 PowerShell 并执行脚本
# -WindowStyle Hidden: 隐藏窗口
# -ExecutionPolicy Bypass: 绕过执行策略限制
$Action = New-ScheduledTaskAction -Execute "powershell.exe" `
    -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$ScriptPath`""

# 定义触发器：用户登录时
$Trigger = New-ScheduledTaskTrigger -AtLogon

# 定义设置：不管用户是否登录都运行，隐藏窗口，网络可用时才启动
$Settings = New-ScheduledTaskSettingsSet `
    -StartWhenAvailable `
    -DontStopOnIdleEnd `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -Hidden

# 注册任务
Register-ScheduledTask -TaskName $TaskName `
    -Action $Action `
    -Trigger $Trigger `
    -Settings $Settings `
    -RunLevel Highest `
    -Force | Out-Null

Write-Host "========================================" -ForegroundColor Green
Write-Host "  创建成功！" -ForegroundColor Green
Write-Host "  任务名称: $TaskName"
Write-Host "  脚本路径: $ScriptPath"
Write-Host "========================================"
Write-Host "提示：请重启电脑测试是否生效。" -ForegroundColor Cyan
Read-Host "按回车退出"