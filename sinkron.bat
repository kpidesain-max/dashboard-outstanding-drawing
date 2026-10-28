@echo off
cd /d "%~dp0sync"
python -m pip install -r requirements.txt
python sync_drawing.py config_setting.xlsx 7 --push http://localhost:3000 --every 30
pause
