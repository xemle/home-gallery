# Fetch option: insecure

Tags: fetch, option, insecure

## Self signed certificates fails by default

* Use file space "remote"
* Init dir from "fetch/selfsigned-server"
* Start HTTPS server
* Use file space "local"
* Fetch
* Storage has no entry for "25d7b73"
* Storage has no entry for "96419bb"

## Allow self signed certificates

* Use file space "remote"
* Init dir from "fetch/selfsigned-server"
* Start HTTPS server
* Use file space "local"
* Fetch with args "--insecure"
* Storage has entry "image-preview-128.jpg" for "25d7b73"
* Storage has entry "image-preview-1920.jpg" for "96419bb"

___
* Stop server