"""Cache missing game artwork from the versioned Wiki snapshot."""
import pathlib, runpy, sys
script=pathlib.Path(__file__).with_name('sync-wiki-catalog.py')
sys.argv=[str(script),'--download-art',*sys.argv[1:]]
runpy.run_path(str(script),run_name='__main__')
