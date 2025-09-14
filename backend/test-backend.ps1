# test-appointments.ps1

$BASE = "http://localhost:5000"

Write-Host "=== Starting Appointments E2E ==="

# 1) Login (signup fallback)
try {
  $login = Invoke-RestMethod -Method Post -Uri "$BASE/api/auth/login" -Headers @{ "Content-Type"="application/json" } -Body '{"email":"testuser2@example.com","password":"Test@123"}'
  $TOKEN = $login.token
} catch {
  $signup = Invoke-RestMethod -Method Post -Uri "$BASE/api/auth/signup" -Headers @{ "Content-Type"="application/json" } -Body '{"email":"testuser2@example.com","password":"Test@123","role":"admin"}'
  $TOKEN = $signup.token
}
Write-Host "OK login"

# 2) Create a patient
$patientPayload = @{
  firstName = "Appt"
  lastName  = "Tester"
  dob       = "1990-01-01"
  gender    = "M"
  contact   = @{ phone="5550001111"; email="appt@test.com" }
}
$patient = Invoke-RestMethod -Method Post -Uri "$BASE/api/patients" -Headers @{ "Authorization"="Bearer $TOKEN"; "Content-Type"="application/json" } -Body ($patientPayload | ConvertTo-Json -Depth 5)
$PATIENT_ID = $patient._id
Write-Host "OK patient: $PATIENT_ID"

function Get-AvailUri {
  param([string]$providerId, [string]$dateISO)
  $u = [System.UriBuilder]::new("$BASE/api/appointments/availability")
  $q = [System.Web.HttpUtility]::ParseQueryString([string]::Empty)
  $q["providerId"] = $providerId
  $q["date"] = $dateISO
  $u.Query = $q.ToString()
  return $u.Uri.AbsoluteUri
}

function Get-ListByProviderUri {
  param([string]$providerId, [string]$dateISO)
  $u = [System.UriBuilder]::new("$BASE/api/appointments")
  $q = [System.Web.HttpUtility]::ParseQueryString([string]::Empty)
  $q["providerId"] = $providerId
  $q["date"] = $dateISO
  $u.Query = $q.ToString()
  return $u.Uri.AbsoluteUri
}

function Get-FirstSlot {
  param([string]$providerId, [string]$dateISO)
  $uri = Get-AvailUri -providerId $providerId -dateISO $dateISO
  $avail = Invoke-RestMethod -Method Get -Uri $uri -Headers @{ "Authorization"="Bearer $TOKEN" }
  if ($avail.availableSlots -and $avail.availableSlots.Count -gt 0) { return $avail.availableSlots[0] }
  return $null
}

$providerId = "provider123"
$today = (Get-Date).ToString("yyyy-MM-dd")
$slotStart = Get-FirstSlot -providerId $providerId -dateISO $today
$bookDate = $today
if (-not $slotStart) {
  $tomorrow = (Get-Date).AddDays(1).ToString("yyyy-MM-dd")
  $slotStart = Get-FirstSlot -providerId $providerId -dateISO $tomorrow
  $bookDate = $tomorrow
}
if (-not $slotStart) { throw "No available slots for $providerId today or tomorrow." }

$slotStartDt = [DateTime]::Parse($slotStart)
$slotEndIso  = $slotStartDt.AddHours(1).ToString("o")
$slotStartIso = $slotStartDt.ToString("o")
Write-Host "Using slot $slotStartIso to $slotEndIso"

# 3) Book
$bookPayload = @{ patient=$PATIENT_ID; providerId=$providerId; start=$slotStartIso; end=$slotEndIso }
$booked = Invoke-RestMethod -Method Post -Uri "$BASE/api/appointments" -Headers @{ "Authorization"="Bearer $TOKEN"; "Content-Type"="application/json" } -Body ($bookPayload | ConvertTo-Json -Depth 5)
$APPT_ID = $booked._id
Write-Host "OK booked: $APPT_ID"

# 4) Get by id
$got = Invoke-RestMethod -Method Get -Uri "$BASE/api/appointments/$APPT_ID" -Headers @{ "Authorization"="Bearer $TOKEN" }
Write-Host "OK get-by-id, status=$($got.status)"

# 5) Reschedule to a different free slot
$altSlot = $null
$availUri = Get-AvailUri -providerId $providerId -dateISO $bookDate
$avail = Invoke-RestMethod -Method Get -Uri $availUri -Headers @{ "Authorization"="Bearer $TOKEN" }
if ($avail.availableSlots) {
  foreach ($s in $avail.availableSlots) { if ($s -ne $slotStartIso) { $altSlot = $s; break } }
}
if (-not $altSlot) {
  $nxt = (Get-Date $bookDate).AddDays(1).ToString("yyyy-MM-dd")
  $availUri2 = Get-AvailUri -providerId $providerId -dateISO $nxt
  $avail2 = Invoke-RestMethod -Method Get -Uri $availUri2 -Headers @{ "Authorization"="Bearer $TOKEN" }
  if ($avail2.availableSlots -and $avail2.availableSlots.Count -gt 0) { $altSlot = $avail2.availableSlots[0] }
}
if (-not $altSlot) { throw "No alternative slot to reschedule." }

$altStartDt = [DateTime]::Parse($altSlot)
$altEndIso  = $altStartDt.AddHours(1).ToString("o")
$resPayload = @{ start=$altSlot; end=$altEndIso }
$res = Invoke-RestMethod -Method Put -Uri "$BASE/api/appointments/$APPT_ID" -Headers @{ "Authorization"="Bearer $TOKEN"; "Content-Type"="application/json" } -Body ($resPayload | ConvertTo-Json -Depth 5)
Write-Host "OK rescheduled, status=$($res.status)"

# 6) List by patient
$byPatient = Invoke-RestMethod -Method Get -Uri "$BASE/api/appointments?patientId=$PATIENT_ID" -Headers @{ "Authorization"="Bearer $TOKEN" }
Write-Host "OK list by patient, count=$($byPatient.items.Count)"

# 7) List by provider/date (using UriBuilder)
$listProvUri = Get-ListByProviderUri -providerId $providerId -dateISO $bookDate
$byProvider = Invoke-RestMethod -Method Get -Uri $listProvUri -Headers @{ "Authorization"="Bearer $TOKEN" }
Write-Host "OK list by provider/date, count=$($byProvider.items.Count)"

# 8) Cancel
Invoke-RestMethod -Method Delete -Uri "$BASE/api/appointments/$APPT_ID" -Headers @{ "Authorization"="Bearer $TOKEN" }
Write-Host "OK cancelled"

$afterCancel = Invoke-RestMethod -Method Get -Uri "$BASE/api/appointments/$APPT_ID" -Headers @{ "Authorization"="Bearer $TOKEN" }
Write-Host "Status after cancel: $($afterCancel.status)"

# 9) Cleanup patient
Invoke-RestMethod -Method Delete -Uri "$BASE/api/patients/$PATIENT_ID" -Headers @{ "Authorization"="Bearer $TOKEN" }
Write-Host "OK patient deleted"

Write-Host "=== Appointments E2E done ==="
