' Statistika Pro - Silent Background Service Starter
Set objShell = CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")

strScriptDir = objFSO.GetParentFolderName(WScript.ScriptFullName)
strRunApi = objFSO.BuildPath(strScriptDir, "run-api.bat")
strRunWeb = objFSO.BuildPath(strScriptDir, "run-web.bat")

' Jalankan Backend (Hidden = 0, NoWait = False)
objShell.Run "cmd.exe /c """ & strRunApi & """", 0, False

' Beri jeda 1 detik lalu jalankan Frontend
WScript.Sleep 1000
objShell.Run "cmd.exe /c """ & strRunWeb & """", 0, False
