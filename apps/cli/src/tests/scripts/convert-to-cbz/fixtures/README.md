# Fixtures for convert-to-cbz

Place mixed sample input files used by integration tests here:

- Nested directories with `.pdf` and `.epub`
- Corrupted files for failure-path tests
- Permission-restricted outputs for write error tests

Most EPUB fixtures are generated in tests so their image bytes and spine order
stay explicit. `pdfimages-mixed-list.txt` is a captured Poppler listing used to
exercise extract-versus-render page planning without depending on a local
Poppler installation.
