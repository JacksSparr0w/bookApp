#!/bin/bash

green="\e[0;32m"
rst="\e[0m"     # Text reset

prepare()
{
    echo -en $green$1$rst"\n"
}

prepare "Update web component"

cd ../../sc-web/
npm install
grunt build
cd ../kb/ui_components/src/components/search_book_by_rating
npm install
grunt build

cd ../../../../../scripts
