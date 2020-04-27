#!/bin/bash

red="\e[1;31m"  # Red B
blue="\e[1;34m" # Blue B
green="\e[0;32m"

bwhite="\e[47m" # white background
rst="\e[0m"     # Text reset

st=$1


stage()
{
    let "st += 1"
    echo -en $green"[$st]$rst" $blue"$1...\n"$rst
}

base_path=src
sc_web_path=../../ostis/sc-web/client
sc_web_static_path=$sc_web_path/static

stage "Build component"

cd $base_path
python build_components.py -a -i
cd -

append_line()
{
    if grep -Fxq "$3" $1
    then
        # code if found
        echo -en "Link to " $blue"$2"$rst "already exists in " $blue"$1"$rst "\n"
    else
        # code if not found
        echo -en "Append '" $green"$2"$rst "' -> " $green"$1"$rst "\n"
        echo $3 >> $1
    fi
}

append_js()
{
    append_line $1 $2 "<script type=\"text/javascript\" charset=\"utf-8\" src=\"/static/$2\"></script>"
}

append_css()
{
    append_line $1 $2 "<link rel=\"stylesheet\" type=\"text/css\" href=\"/static/$2\" />"
}

stage "Copy component"

cp -Rfv $base_path/components/tag_cloud/static/* $sc_web_static_path
cp -Rfv $base_path/components/similar_books/static/* $sc_web_static_path
cp -Rfv $base_path/components/notes/static/* $sc_web_static_path
cp -Rfv $base_path/components/define_age_limit/static/* $sc_web_static_path
cp -Rfv $base_path/components/by_author/static/* $sc_web_static_path
cp -Rfv $base_path/components/book_search/static/* $sc_web_static_path
cp -Rfv $base_path/components/book_search_event/static/* $sc_web_static_path
cp -Rfv $base_path/components/book_search_unified/static/* $sc_web_static_path

stage "Install component"

append_js $sc_web_path/templates/components.html components/js/book_search_unified/book_search_unified.js
append_css $sc_web_path/templates/components.html components/css/book_search_unified.css
append_js $sc_web_path/templates/components.html components/js/tag_cloud/tag_cloud.js
append_js $sc_web_path/templates/components.html components/js/by_author/by_author.js
append_js $sc_web_path/templates/components.html components/js/tag_cloud/jquery.tagcanvas.js
append_js $sc_web_path/templates/components.html components/js/similar_books/similar_books.js
append_js $sc_web_path/templates/components.html components/js/bookSearchByEvents/bookSearchByEvents.js
append_js $sc_web_path/templates/components.html components/js/note/note.js
append_js $sc_web_path/templates/components.html components/js/bookSearchByEvents/bookSearchByEvents.js



cd ../../ostis/sc-web/scripts
./install_deps_ubuntu.sh
./prepare_js.sh
python build_components.py -i -a