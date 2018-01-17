package main

import (
  "log"
  "io"
  "net/http"
)

var showHtml = "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"utf-8\"><title>Obsolete</title></head><body><h1>Obsolete</h1><p>The grep plugin is obsolete. You should use the new <a href=\"https://blog.overviewdocs.com/2017/08/08/regular-expression-search/\" target=\"_blank\">Regular-expression search</a> in Overview's search box instead.</p><p>You should delete this View.</p></body></html>"

func getShow(w http.ResponseWriter, r *http.Request) {
  w.Header().Set("Content-Type", "text/html; charset=utf-8")
  w.Header().Set("Cache-Control", "public, max-age=3600")
  w.WriteHeader(http.StatusOK)
  io.WriteString(w, showHtml)
}

func getMetadata(w http.ResponseWriter, r *http.Request) {
  w.Header().Set("Content-Type", "application/json")
  w.Header().Set("Cache-Control", "public, max-age=3600")
  w.WriteHeader(http.StatusOK)
  io.WriteString(w, "{}")
}

func main() {
  http.HandleFunc("/show", getShow)
  http.HandleFunc("/metadata", getMetadata)
  err := http.ListenAndServe(":80", nil)
  if err != nil {
    log.Fatal("ListenAndServe: ", err)
  }
}
