/**
 * Paint panel.
 */

BestBooks.PaintPanel = function (containerId) {
    this.containerId = containerId;
};

let genres = new Map();
let authors = new Map();

BestBooks.PaintPanel.prototype = {

    init: function () {
        this._initMarkup(this.containerId);
    },

    _initMarkup: function (containerId) {
        var container = $('#' + containerId);

        var self = this;
        var agentKeyNode = 'ui_menu_file_for_finding_the_best_work_of_the_author';
        var keynodes = ['ui_menu_file_for_finding_the_best_work_of_the_author'];  

        container.load('static/components/html/find_best_book.html', function() {
        SCWeb.core.Server.resolveScAddr(keynodes, function (keynodes) {
            SCWeb.core.Server.resolveIdentifiers(keynodes, function (idf) {
            	var buttonSearch = idf[keynodes['ui_menu_file_for_finding_the_best_work_of_the_author']];

            	$(buttonFind).html(buttonSearch);

                $(author).on("change paste keyup", function() {
                    let authorName = $(author).val();
                    if (authorName.length > 4){
                        self._search(authorName, $("#authorList"));
                    }
                });

                $(genre).on("change paste keyup", function() {
                    let genreName = $(genre).val();
                    if (genreName.length > 4){
                        self._search(genreName, $("#genreList"));
                    }
                });

                $(buttonFind).click(function() {
                    $(labelProcessing).html = "Processing...";
                    if ($(author).val() == ""){
                    	$(author).css("border-color", "rgb(255, 17, 17)");
                    	$(results).html("<p>" + "Поле Автор не может быть пустым!" + "</p><br>");
                    	return;
                    }
                    if ($(genre).val() == ""){
                    	$(genre).css("border-color", "rgb(255, 17, 17)");
                    	$(results).html("<a>" + "Поле Жанр не может быть пустым!" + "</a><br>");
                    	return;
                    }
                    var authorName = $(author).val();
                    var genreName = $(genre).val();
                    if (genres.has(genreName) && authors.has(authorName)){
                        var rez = self._findBestBook(genres.get(genreName), authors.get(authorName));
                        $(results).html("<h4>Лучшая книга:</h4>");
                        $(labelProcessing).empty();
                    }
                });
            });
        });
    });

    },
    _findBestBook: function(genreAddr, authorAddr) {
    		$(results).empty();
            return SCWeb.core.Server.resolveScAddr(['ui_menu_file_for_finding_the_best_work_of_the_author'], function (data) {
                var cmd = data['ui_menu_file_for_finding_the_best_work_of_the_author'];
                console.log("cmd", cmd);
                SCWeb.core.Server.doCommand(cmd, [authorAddr, genreAddr], function (result) {
                    if (result.question != undefined) {
                        console.log(result.question);
                        window.scHelper.getAnswer(result.question).done(function (addr) {                       
                                window.scHelper.getSetElements(addr).done(function(set) {
                                    SCWeb.core.Server.resolveIdentifiers(set, function(idtfs){
                                    	let item;
					Object.entries(idtfs).forEach(el=>{if (el[1]  != "средняя оценка*"){
					item =el;}});
                                        $(results).append('<div class="scs-scn-keyword"><a href="#" class="scs-scn-element scs-scn-field scs-scn-highlighted" sc_addr=' + item[0] + '>' + item[1] + '</a></div>');
                                        console.log("item", item);
                                    });
                                });
                            }).fail(function (v) {
                                console.log("error");
                                $(results).append("<h5>Книг не найдено!</h>")
                         });
                    }
                });
            });
    },

    _search: function(query, item) {
        SCWeb.core.Server.findIdentifiersSubStr(query, function (data) {
                        $(item).empty();
                        data.main.forEach((element) =>{
                            var key = element[1];
                            var value = element[0];
                            if (item.attr('id') == "genreList"){
                            	genres.set(key, value);
                            }
                            if (item.attr('id') == "authorList"){
                            	authors.set(key, value);
                            } 
                            item.append("<option value= "+ "\'" + key + "\'>");                                     
                        });
                    });
    }
};
