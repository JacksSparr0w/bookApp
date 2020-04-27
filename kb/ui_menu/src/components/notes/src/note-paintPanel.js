var id = 0;
var books_id = 0;
var definition;
var containerId;
var books;
var booksList ;
var booksListForWishList ;
var booksArray = [];
var booksArrayForWishList = [];
var typeOfNote =
    {
        NOTE:1,
        BOOKMARK:2,
    };

//очистка страницы перед пеезагрузкой содержимого
function _cleanWindow (){
    if (document.getElementById('data') != null) {
        document.getElementById('data').remove();
    }
    id = 0;
}

// добавление rrel
// node1 - узел, из которого идет дуга
// node2 - узел, в который идет дуга
// node1 - rrel
// возваращает адрес созданной дуги между узлами
function _addRrel(node1, node2, rrel){
     window.sctpClient.create_arc(sc_type_arc_pos_const_perm, node1, node2).then(
            function (arc_between_nodes) {
                window.sctpClient.create_arc(sc_type_arc_pos_const_perm, rrel, arc_between_nodes).then(
                    function () {
                        return arc_between_nodes
                    })
            })
};

// добавление nrel
// node1 - узел, из которого идет дуга
// node2 - узел, в который идет дуга
// node1 - nrel
// возваращает адрес созданной дуги между узлами
function _addNrel(node1, node2, nrel){
     window.sctpClient.create_arc(sc_type_arc_common | sc_type_const, node1, node2).then(
            function (arc_between_nodes) {
                window.sctpClient.create_arc(sc_type_arc_pos_const_perm, nrel, arc_between_nodes).then(
                    function () {
                        return arc_between_nodes
                    })
            })
};

// удаление заметок
// удаляет html код
// удаляет узел из таблицы
function exit(id, addr) {
  var el = document.getElementById(id);
    // удаление html
  el.parentNode.removeChild(el);
    // удаление sc
  SCWeb.core.Server.resolveScAddr(['nrel_main_idtf'], function (keynodes) {
    nrel_main_idtf_addr = keynodes['nrel_main_idtf'];
    var params = [ nrel_main_idtf_addr];  
      SCWeb.core.Server.resolveIdentifiers(params, function (keynodes) {
        window.sctpClient.iterate_elements(SctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F,
            [
                addr,
                sc_type_arc_common | sc_type_const,
                sc_type_link,
                sc_type_arc_pos_const_perm,
                nrel_main_idtf_addr
            ])
            .then(function (linkAddr) {
                link = linkAddr[0][2];
                window.sctpClient.set_link_content(link, "Объект удален");
                window.sctpClient.erase_element(addr);
            })
        })
    }) 
};

// загрузка книг из базы знаний
function loadBooks(){
    SCWeb.core.Server.resolveScAddr(['book'], function (keynodes) {
        book_addr = keynodes['book'];
        var params = [book_addr];
        SCWeb.core.Server.resolveIdentifiers(params, function (keynodes) {
            window.sctpClient.iterate_elements(SctpIteratorType.SCTP_ITERATOR_3F_A_A,
                [
                    book_addr,
                    sc_type_arc_pos_const_perm,
                    0
                ])
                .then(
                    function (result) {
                        books = result
                        convertBooks();
                    },
                )
        })
    })
}


// перевод загруженных с базы книг в формат для работы в js
function convertBooks() {
    booksList = "<select  id='bookTxt' style=\"margin-bottom : 10px\">";
    booksListForWishList = "<select  id='bookTxt'  style=\"margin-bottom : 10px\">";
    booksArray = [];
    booksArrayForWishList = [];
    SCWeb.core.Server.resolveScAddr(['nrel_main_idtf', 'concept_wish_list' ], function (keynodes) {
        nrel_main_idtf_addr = keynodes['nrel_main_idtf'];
        concept_wish_list_addr = keynodes['concept_wish_list'];
        var params = [nrel_main_idtf_addr, concept_wish_list_addr];
        SCWeb.core.Server.resolveIdentifiers(params, function (keynodes) {
            for (var el = 0; el < books.length; el++) {
                book = books[el][2];
                window.sctpClient.iterate_elements(SctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F, [
                    book,
                    sc_type_arc_common | sc_type_const,
                    sc_type_link,
                    sc_type_arc_pos_const_perm,
                    nrel_main_idtf_addr
                ])
                    .then(function (identifiers) {
                        window.sctpClient.get_link_content(identifiers[0][2], 'string')
                            .then(function (content) {
                                book_js = {}
                                params = content
                                for (var j = 0; j < params.length; j++) {
                                    params = params.replace(" ", "___");
                                }
                                book_js['name'] = content;
                                book_js['attr'] = identifiers[0][2];
                                book_js['book_addr'] = books[books_id][2]
                                if (booksArray.length == 0){
                                    booksArray.push(book_js)
                                    books_id += 1;
                                    booksList = booksList + "<option value = " + identifiers[0][2] + ">" + content + "</option>";
                                    window.sctpClient.iterate_elements(SctpIteratorType.SCTP_ITERATOR_3F_A_F, [
                                        concept_wish_list_addr,
                                        sc_type_arc_pos_const_perm,
                                        book
                                    ])
                                    .done(function (result){
                                        console.log(booksArrayForWishList)
                                        console.log(book_js)
                                    })
                                    .fail(function (result) {
                                        if (!booksArrayForWishList.includes(book_js)){
                                            booksArrayForWishList.push(book_js)
                                            booksListForWishList = booksListForWishList + "<option value = " + identifiers[0][2] + ">" + content + "</option>";
                                        }
                                    });
                                }
                                else{
                                    ArrayLenght = booksArray.length
                                    addBook = true
                                    for (var book_var=0; book_var<ArrayLenght; book_var++){
                                        if (book_js.name == booksArray[book_var].name){
                                            addBook = false
                                        }
                                    }
                                    if (addBook){
                                        booksArray.push(book_js)
                                        books_id += 1;
                                        booksList = booksList + "<option value = " + identifiers[0][2] + ">" + content + "</option>";
                                        window.sctpClient.iterate_elements(SctpIteratorType.SCTP_ITERATOR_3F_A_F, [
                                            concept_wish_list_addr,
                                            sc_type_arc_pos_const_perm,
                                            book
                                        ])
                                        .done(function (result){
                                            console.log(booksArrayForWishList)
                                            console.log(book_js)
                                        })
                                        .fail(function (result) {
                                            if (!booksArrayForWishList.includes(book_js)){
                                                booksArrayForWishList.push(book_js)
                                                booksListForWishList = booksListForWishList + "<option value = " + identifiers[0][2] + ">" + content + "</option>";
                                            }
                                        });
                                    }

                                }
                            });
                    });
            }
        })
    })
}


// обновление списка книг доступных для добавления в список желаний
function updateBookList() {
    booksForList = booksArrayForWishList
    booksListForWishList = "<select  id='bookTxt'  style=\"margin-bottom : 10px\">";
    for (var el = 0; el < booksForList.length; el++) {
        book = booksForList[el];
        booksListForWishList = booksListForWishList + "<option value = " + book['attr'] + ">" + book['name']  + "</option>";
    }
}


// добавление книги в список желаний
function _addBook() {
    var container = $('#' + containerId);
    SCWeb.core.Server.resolveScAddr(['concept_wish_list'], function (keynodes) {
        concept_wish_list_addr = keynodes['concept_wish_list'];
        var params = [concept_wish_list_addr];
        SCWeb.core.Server.resolveIdentifiers(params, function (keynodes) {
            var bookAttr = document.getElementById('bookTxt').value
            for (var i=0; i<booksArray.length; i++){
                if ( booksArray[i]['attr'] == bookAttr){
                    book = booksArray[i]
                    window.sctpClient.create_arc(sc_type_arc_pos_const_perm, concept_wish_list_addr, book.book_addr)
                    pos = booksArrayForWishList.indexOf(book);
                    booksArrayForWishList.splice(pos, 1)
                    _showWishList()
                }
            }
        });
    });
}

//добавление заметок по типу
function _addNote( noteType = typeOfNote.NOTE ) {
    var container = $('#' + containerId);
    SCWeb.core.Server.resolveScAddr(['concept_bookmark', 'book', 'nrel_main_idtf', 'nrel_book', 'rrel_type_of_bookmark', 'concept_note', 'concept_note_list', 'rrel_page', 'rrel_book_size' ], function (keynodes) {
        concept_bookmark_addr = keynodes['concept_bookmark'];
        book_addr = keynodes['book'];
        nrel_main_idtf_addr = keynodes['nrel_main_idtf'];
        nrel_book_addr = keynodes['nrel_book'];
        rrel_page_addr = keynodes['rrel_page'];
        rrel_book_size_addr = keynodes['rrel_book_size'];
        concept_note_addr = keynodes['concept_note'];
        concept_note_list_addr = keynodes['concept_note_list'];
        var params = [concept_bookmark_addr, book_addr, nrel_main_idtf_addr, nrel_book_addr, rrel_book_size_addr, rrel_page_addr, concept_note_addr, concept_note_list_addr];
        SCWeb.core.Server.resolveIdentifiers(params, function (keynodes) {
            var bookAttr = document.getElementById('bookTxt').value
            var name = "";
                for (var i=0; i<booksArray.length; i++){
                    if ( booksArray[i]['attr'] == bookAttr){
                        book = booksArray[i]
                        name = book.name;
                        window.sctpClient.create_link().done(function (nameLink) {
                            text = ""
                            var page = document.getElementById('page').value;
                            if (noteType == typeOfNote.BOOKMARK){
                                text = "Вы остановились в книге " + name + " на странице " + page + ". ";
                                noteClass = concept_bookmark_addr;
                            }
                            else {
                                text = document.getElementById("text").value;
                                noteClass = concept_note_addr;
                            }
                            window.sctpClient.set_link_content(nameLink, text);
                            window.sctpClient.create_node(sc_type_const).done(function (note) {
                                window.sctpClient.create_arc(sc_type_arc_pos_const_perm, noteClass, note)
                                    _addNrel(note,nameLink,nrel_main_idtf_addr)
                                    _addNrel(note, book.book_addr, nrel_book_addr)
                                     window.sctpClient.create_link().then(
                                        function (numberOfPages) {
                                            if (page!=""){
                                                window.sctpClient.set_link_content(numberOfPages, page).then(
                                                    function () {
                                                        _addRrel(note, numberOfPages, rrel_page_addr)
                                                        _showNotes(noteType);
                                                    })
                                            }
                                            else{
                                                _showNotes(noteType);
                                                }
                                        }
                                     )
                                })
                        })
                    }
                };
            })
        });
}

// вывод имеющихся заметок
function _showNotes (noteType = typeOfNote.NOTE) {
    _cleanWindow()
    var container = $('#' + containerId);
    addNotesCode = '';
    SCWeb.core.Server.resolveScAddr(['concept_bookmark', 'concept_note', 'book', 'nrel_main_idtf', 'nrel_book', 'rrel_type_of_bookmark', 'rrel_page', 'rrel_book_size' ], function (keynodes) {
    concept_bookmark_addr = keynodes['concept_bookmark'];
    book_addr = keynodes['book'];
    concept_note_addr = keynodes['concept_note'];;
    nrel_main_idtf_addr = keynodes['nrel_main_idtf'];
    nrel_book_addr = keynodes['nrel_book'];
    rrel_page_addr = keynodes['rrel_page'];
    rrel_book_size_addr = keynodes['rrel_book_size'];
    if (noteType == typeOfNote.BOOKMARK){
        noteClass = concept_bookmark_addr
        noNotes = '<h3> У вас нет закладок. Для добавления нажмите клавишу "Добавить закладку"</h3>'
        beginDataBlock = "<div id='data' style='margin: 1%'><div style=\"display: inline-block\; margin-bottom: 1%\">" +
            booksList +
            "</select><input name=\"searchTxt\" type=\"text\" maxlength=\"512\" id=\"page\" placeholder='Введите номер страницы' class=\"form-control\">"+
            "<button id=\"addNote\" type=\"button\" class=\"btn btn-success sc-no-default-cmd\"  style=\"margin-top: 10px\">Добавить закладку</button></div>";
    }
    else {
        noteClass = concept_note_addr
        noNotes = '<h3> У вас нет заметок. Для добавления нажмите клавишу "Добавить заметку"</h3>'
        beginDataBlock = "<div id='data' style='margin: 1%'><div style=\"display: inline-block\; margin-bottom: 1%\">" +
            booksList +
            "</select><input name=\"searchTxt\" type=\"text\" maxlength=\"512\" id=\"page\" placeholder='Введите номер страницы' class=\"form-control\">"+
            "<input name=\"searchTxt\" type=\"text\" maxlength=\"512\" id=\"text\" placeholder='Введите текст закладки' class=\"form-control\">" +
            "<button id=\"addNote\" type=\"button\" class=\"btn btn-success sc-no-default-cmd\"  style=\"margin-top: 10px\">Добавить заметку</button></div>";
    }
    var params = [concept_bookmark_addr, book_addr, nrel_main_idtf_addr, concept_note_addr, nrel_book_addr, rrel_book_size_addr, rrel_page_addr];
    SCWeb.core.Server.resolveIdentifiers(params, function(keynodes){
        // поиск заметок в базе знаний
        window.sctpClient.iterate_elements(SctpIteratorType.SCTP_ITERATOR_3F_A_A,
            [
                noteClass,
                sc_type_arc_pos_const_perm,
                0
            ])
        .then(
            function (notes) {
                // removed нужен, так как нет нормального удаления, только замена на "Объект удален"
                var removed = 0;
                for (var i = 0; i < notes.length; i++) {
                    var note = notes[i];
                    var noteLink = note[2]
                    window.sctpClient.iterate_elements(SctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F, [
                        noteLink,
                        sc_type_arc_common | sc_type_const,
                        sc_type_link,
                        sc_type_arc_pos_const_perm,
                        nrel_main_idtf_addr
                    ]).done(function (identifiers) {
                        window.sctpClient.get_link_content(identifiers[0][2], 'string')
                            .done(function (content) {
                                param = content
                                // перевод в формат, который передастся как параметр в другие функции
                                for (var j = 0; j < content.length; j++) {
                                    param = param.replace(" ", "___");
                                }
                                link = notes[id + removed][2];
                                if (param != "Объект___удален") {
                                    note = "<div id=\"" + id + "\" ><button onclick=exit(" + id + "\," + link + ") class=\"btn btn-danger sc-no-default-cmd\" style='margin-left : 1%; margin-bottom: 1%'>" +
                                        "<span class=\"glyphicon glyphicon-trash\"></span></button> ";
                                         if (noteType == typeOfNote.BOOKMARK){
                                             note += "<button onclick=editBookmark(" + id + "\," + link + ") " +
                                                 "class=\"btn btn-warning sc-no-default-cmd\" style='margin-left : 1%; margin-bottom: 1%; margin-right: 1%'><span class=\"glyphicon glyphicon-pencil\"></span></button>";
                                         }
                                         else {
                                             note += "<button onclick=editNote(" + id + "\," + link + "\,\"" + param + "\") " +
                                                 "class=\"btn btn-warning sc-no-default-cmd\" style='margin-left : 1%; margin-bottom: 1%; margin-right: 1%'><span class=\"glyphicon glyphicon-pencil\"></span></button>";
                                         }
                                         note += "  <a href=\"#\" class=\"sc-element\" sc_addr=\""+ link + "\" >" + content + "</a></div>";
                                    addNotesCode = addNotesCode + note;
                                    id = id + 1;
                                }
                                else { removed = removed + 1;};

                                if ((id + removed) == notes.length) {
                                    if (removed == notes.length) {
                                        addNotesCode = noNotes
                                    }
                                    addNotesCode = beginDataBlock + addNotesCode + '</div>';
                                    container.append(addNotesCode);
                                    $('#addNote').click(function () {
                                        _addNote(noteType);
                                    });
                                };
                            });
                    })
                }
            },
            function () {
                addNotesCode = beginDataBlock + noNotes + "</div>"
                container.append(addNotesCode);
                $('#addNote').click(function () {
                    _addNote(noteType);
                });
            });
        });
    });
}

// вывод списка желаний
function _showWishList () {
    _cleanWindow()
    updateBookList()
    var container = $('#' + containerId);
    addNotesCode = '';
    SCWeb.core.Server.resolveScAddr(['concept_wish_list', 'book', 'nrel_main_idtf', ], function (keynodes) {
    concept_wish_list_addr = keynodes['concept_wish_list'];
    book_addr = keynodes['book'];
    nrel_main_idtf_addr = keynodes['nrel_main_idtf'];
    noBooks = '<h3> У вас нет книг в списке желаний. Для добавления нажмите клавишу "Добавить книгу"</h3>'
    beginDataBlock = "<div id='data' style='margin: 1%'><div style=\"display: inline-block\; margin-bottom: 1%\">" +
        booksListForWishList +
        "</select><button id=\"add\" type=\"button\" class=\"btn btn-success sc-no-default-cmd\"  style=\"margin: 10px\" >Добавить книгу</button></div>";
    var params = [concept_wish_list_addr, book_addr, nrel_main_idtf_addr];
    SCWeb.core.Server.resolveIdentifiers(params, function(keynodes){
        // поиск заметок в базе знаний
        window.sctpClient.iterate_elements(SctpIteratorType.SCTP_ITERATOR_3F_A_A,
            [
                concept_wish_list_addr,
                sc_type_arc_pos_const_perm,
                0
            ])
        .then(
            function (books) {
                // removed нужен, так как нет нормального удаления, только замена на "Объект удален"
                var removed = 0;
                for (var i = 0; i < books.length; i++) {
                    var book = books[i];
                    var bookLink = book[2]
                    window.sctpClient.iterate_elements(SctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F, [
                        bookLink,
                        sc_type_arc_common | sc_type_const,
                        sc_type_link,
                        sc_type_arc_pos_const_perm,
                        nrel_main_idtf_addr
                    ]).done(function (identifiers) {
                        window.sctpClient.get_link_content(identifiers[0][2], 'string')
                            .done(function (content) {
                                param = content
                                // перевод в формат, который передастся как параметр в другие функции
                                for (var j = 0; j < content.length; j++) {
                                    param = param.replace(" ", "___");
                                }
                                link = books[id + removed][2];
                                if (param != "Объект___удален") {
                                    note = "<div id=\"" + id + "\" >" + (id+1) + ".  <a href=\"#\" class=\"sc-element\" sc_addr=\""+ link + "\" >" + content + "</a></div>";
                                    addNotesCode = addNotesCode + note;
                                    id = id + 1;
                                }
                                else { removed = removed + 1;};

                                if ((id + removed) == books.length) {
                                    if (removed == books.length) {
                                        addNotesCode = noBooks
                                    }
                                    addNotesCode = beginDataBlock + addNotesCode + '</div>';
                                    container.append(addNotesCode);
                                    $('#add').click(function () {
                                        _addBook();
                                    });
                                };
                            });
                    })
                }
            },
            function () {
                addNotesCode = beginDataBlock + noBooks + "</div>"
                container.append(addNotesCode);
                $('#add').click(function () {
                    _addBook();
                });
            });
        });
    });
}



// редактирование заметок
function editNote(id, addr, str) {
    // дешифровка параметра
    param = str;
    for (var i=0; i< str.length; i++){
        param = param.replace("___", " ");
    }
    var el = document.getElementById(id);
    var newvalue = prompt("Введите текст заметки", param);
    if (newvalue != null){
        SCWeb.core.Server.resolveScAddr(['nrel_main_idtf'], function (keynodes) {
        nrel_main_idtf_addr = keynodes['nrel_main_idtf'];
        var params = [nrel_main_idtf_addr];
        SCWeb.core.Server.resolveIdentifiers(params, function (keynodes) {
            window.sctpClient.iterate_elements(SctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F,
                [
                    addr,
                    sc_type_arc_common | sc_type_const,
                    sc_type_link,
                    sc_type_arc_pos_const_perm,
                    nrel_main_idtf_addr
                ])
                .then(function (linkAddr) {
                    link = linkAddr[0][2];
                    window.sctpClient.set_link_content(link, newvalue);
                    _showNotes()
                })
            })
        })
    };
};

// редактирование закладок
function editBookmark(id, addr) {
        var text = "Введите номер страницы, на которой вы остановились";
        var page = prompt(text);
        if (page != null) {
            SCWeb.core.Server.resolveScAddr(['rrel_page', 'nrel_main_idtf', 'nrel_book'], function (keynodes) {
                rrel_page_addr = keynodes['rrel_page'];
                nrel_main_idtf_addr = keynodes['nrel_main_idtf'];
                nrel_book_addr = keynodes['nrel_book']
                var params = [rrel_page_addr, nrel_main_idtf_addr, nrel_book_addr];
                SCWeb.core.Server.resolveIdentifiers(params, function (keynodes) {
                    window.sctpClient.iterate_elements(SctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F,
                        [
                            addr,
                            sc_type_arc_pos_const_perm,
                            sc_type_link,
                            sc_type_arc_pos_const_perm,
                            rrel_page_addr
                        ])
                        .then(function (linkAddr) {
                            link = linkAddr[0][2]
                            window.sctpClient.set_link_content(link, page);
                            window.sctpClient.iterate_elements(SctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F,
                            [
                                addr,
                                sc_type_arc_common | sc_type_const,
                                sc_type_node,
                                sc_type_arc_pos_const_perm,
                                nrel_book_addr
                            ])
                            .then(function (bookAddr) {
                                book = bookAddr[0][2]
                                window.sctpClient.iterate_elements(SctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F,
                                [
                                    book,
                                    sc_type_arc_common | sc_type_const,
                                    sc_type_link,
                                    sc_type_arc_pos_const_perm,
                                    nrel_main_idtf_addr
                                ])
                                .then(function (bookLabelAddr) {
                                    bookLabel = bookLabelAddr[0][2]
                                    window.sctpClient.get_link_content(bookLabel, 'string')
                                        .done(function (content) {
                                            text = "Вы остановились в книге " + content + " на странице " + page + ". ";
                                            window.sctpClient.iterate_elements(SctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F,
                                            [
                                                addr,
                                                sc_type_arc_common | sc_type_const,
                                                sc_type_link,
                                                sc_type_arc_pos_const_perm,
                                                nrel_main_idtf_addr
                                            ])
                                            .then(function (noteLabelAddr) {
                                                noteLabel = noteLabelAddr[0][2];
                                                window.sctpClient.set_link_content(noteLabel, text);
                                                _showNotes(typeOfNote.BOOKMARK)
                                            })
                                        })
                                    })
                            })
                         })
                    })
                
            })
        }
};


Example.PaintPanel = function (id) {
    containerId = id;
};

// отрисовка компонента
Example.PaintPanel.prototype = {
    init: function () {
        this._initMarkup();
    },

    _initMarkup: function () {
        var container = $('#' + containerId);
        var self = this;

        loadBooks()

        add_buttons_code = '<div style="display: inline-block; width:40%">' +
                                 '<button id="SimpleNote" type="button" class="btn btn-info sc-no-default-cmd" style="margin: 2%">Заметки</button>' +
                                 '<button id="BookmarkNote" type="button" class="btn btn-info sc-no-default-cmd"  style="margin: 2%">Закладки</button>' +
                                 '<button id="WishList" type="button" class="btn btn-info sc-no-default-cmd"  style="margin: 2%">Список желаний</button>' +
                            '</div>';

        container.append(add_buttons_code);

        $('#SimpleNote').click(function () {
            _showNotes(typeOfNote.NOTE);
        });

        $('#BookmarkNote').click(function () {
            _showNotes(typeOfNote.BOOKMARK);
        });

        $('#WishList').click(function () {
            _showWishList();
        });
    },
};