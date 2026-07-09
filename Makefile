
.PHONY: dev build tidy

dev: 
	wails dev -tags webkit2_41

build-linux:
	wails build -clean -platform linux/amd64 -tags webkit2_41

build-mac:
	wails build -platform darwin/universal

tidy:
	go mod tidy