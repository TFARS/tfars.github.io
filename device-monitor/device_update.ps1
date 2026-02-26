# ================= 配置区 =================
$SupabaseUrl = "https://pdupxxmjlsajnurznvhf.supabase.co"
$SupabaseKey = "sb_publishable_pc0miZHo-55jHixjVWOoqg_TLnFPQ24"
$ScanInterval = 180
# =========================================

function Format-MacAddress {
    param([string]$RawMac)
    if (-not $RawMac) { return $null }
    $clean = $RawMac -replace '[^0-9A-Fa-f]', ''
    if ($clean.Length -ne 12) { return $null }
    return ($clean -split '(..)' -ne '' -join ':').ToUpper()
}

# 极速扫描：只发 UDP 包到 137 端口(NetBIOS)，不等待，只为触发 ARP
function Invoke-FastLanScan {
    try {
        $nic = Get-NetAdapter -Physical | Where-Object { $_.Status -eq "Up" } | Select-Object -First 1
        $ip = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias $nic.Name).IPAddress
        $segments = $ip.Split('.')
        $subnet = "$($segments[0]).$($segments[1]).$($segments[2])."
        
        Write-Host "[扫描] 正在探测 $subnet* 网段..." -ForegroundColor DarkGray

        # 使用 .NET UDP Client 快速发送空包，不关心是否收到回复
        $udpClient = New-Object System.Net.Sockets.UdpClient
        1..254 | ForEach-Object {
            $targetIp = "$subnet$_"
            try {
                # 发送到任意端口，这里选 7 (echo) 或 137 (NetBIOS)
                $udpClient.Send([byte[]]@(0,0), 2, $targetIp, 7) | Out-Null
            } catch {}
        }
        $udpClient.Close()
        
        # 关键：稍微等一下，让 ARP 包飞一会儿 (200ms 足够)
        Start-Sleep -Milliseconds 300
    }
    catch {
        Write-Host "[警告] 扫描出错，依赖缓存" -ForegroundColor Yellow
    }
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  俱乐部设备监控 [极速扫描版]" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 获取本机 MAC
try {
    $nic = Get-NetAdapter -Physical | Where-Object { $_.Status -eq "Up" } | Select-Object -First 1
    $MyMac = Format-MacAddress $nic.MacAddress
    Write-Host "[本机] $MyMac" -ForegroundColor Green
}
catch {
    Read-Host "按回车退出"
    exit
}

while ($true) {
    $utcTime = [DateTime]::UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    Clear-Host
    Write-Host "[$utcTime] 工作中..." -ForegroundColor Gray

    # 1. 极速扫网
    Invoke-FastLanScan

    # 2. 更新自己
    $headersUpsert = @{
        "apikey" = $SupabaseKey
        "Authorization" = "Bearer $SupabaseKey"
        "Content-Type" = "application/json"
        "Prefer" = "resolution=merge-duplicates"
    }
    $selfPayload = @{
        mac_address = $MyMac
        device_status = "normal"
        last_updated = $utcTime
    } | ConvertTo-Json
    try { $null = Invoke-RestMethod -Uri "$SupabaseUrl/rest/v1/devices" -Method Post -Headers $headersUpsert -Body $selfPayload } catch {}

    # 3. 处理 ARP 表
    $headersUpdate = @{
        "apikey" = $SupabaseKey
        "Authorization" = "Bearer $SupabaseKey"
        "Content-Type" = "application/json"
    }
    $arpTable = arp -a
    $updatedCount = 0
    $processed = @{}

    foreach ($line in $arpTable) {
        if ($line -match '([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})') {
            $mac = Format-MacAddress $matches[0]
            if ($mac -and -not $processed.ContainsKey($mac)) {
                $processed[$mac] = $true
                $payload = @{ device_status = "normal"; last_updated = $utcTime } | ConvertTo-Json
                try {
                    $null = Invoke-RestMethod -Uri "$SupabaseUrl/rest/v1/devices?mac_address=eq.$mac" -Method Patch -Headers $headersUpdate -Body $payload
                    $updatedCount++
                } catch {}
            }
        }
    }

    Write-Host "[完成] 更新了 $updatedCount 个设备" -ForegroundColor Green
    Start-Sleep -Seconds $ScanInterval
}