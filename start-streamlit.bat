@echo off
title Food Dehydration Digital Twin - Streamlit
echo ======================================================
echo Starting Food Dehydration Digital Twin (Streamlit)...
echo ======================================================
cd /d "%~dp0"
python -m streamlit run streamlit_app.py --server.port 8501
pause
