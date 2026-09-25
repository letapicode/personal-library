# Use the same port ownership and readiness checks as the registered Win+R launcher.
& (Join-Path $PSScriptRoot 'run-library.cmd')
exit $LASTEXITCODE
