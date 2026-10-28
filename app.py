"""
Entrypoint for Streamlit Community Cloud and local execution.
Delegates execution to streamlit_app.py.
"""
import runpy

if __name__ == "__main__":
    runpy.run_path("streamlit_app.py", run_name="__main__")
