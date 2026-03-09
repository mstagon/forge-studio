기존 실행 중인 Forge Studio 앱을 종료하고 dev 모드로 재시작해줘.

다음 커맨드를 실행해:
```
pkill -f "electron-vite dev" 2>/dev/null; pkill -f "forge-studio" 2>/dev/null; sleep 1 && npx electron-vite dev
```

백그라운드로 실행하고, 실행 완료되면 알려줘.
