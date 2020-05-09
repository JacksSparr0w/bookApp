/* --- src/similar-books-common.js --- */
var SimilarBooks = {};

function extend(child, parent) {
    var F = function () {
    };
    F.prototype = parent.prototype;
    child.prototype = new F();
    child.prototype.constructor = child;
    child.superclass = parent.prototype;
}


/* --- src/similar-books-painter.js --- */

SimilarBooks.Painter = function (containerId) {
	this.containerId = containerId;
	this.keynodes = {};
};

SimilarBooks.Painter.prototype = {

	init: function () {
		this._initMarkup(this.containerId);
	},
	_resolveKeynodes: function () {
		var self = this;

		SCWeb.core.Server.resolveScAddr(['book', 'nrel_main_idtf', 'concept_book', ''],
			function (resolvedKeynodes) {
				self.keynodes = resolvedKeynodes
			});
	},
	_initMarkup: function (containerId) {
		var container = $('#' + containerId);

		var self = this;
		container.load("static/components/js/similar_books/markup.html", function(){
			self._fillBooksList()
			self._fillAuthorsList()
			$('#result_div').hide()
			$('#recommend_result_div').hide()
			$('#similar_books_button').click(function () {
				$('#result_div').hide()
				$('#result').empty();
				self._searchSimilarBooks();
			});
			$('#recommend_books_button').click(function () {
				$('#recommend_result_div').hide()
				$('#result_recommend').empty();
				self._recommendBooks();
			});
		})
		
	},

	_appendSet: function (container,set_addr, nrel_main_idtf_addr) {
		window.scHelper.getSetElements(set_addr).done(function (elements) {


			for (var el = 0; el < elements.length; el++) {

				element = elements[el];
				window.sctpClient.iterate_elements(SctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F, [
					element,
					sc_type_arc_common | sc_type_const,
					sc_type_link,
					sc_type_arc_pos_const_perm,
					nrel_main_idtf_addr])
					.done(function (identifiers) {
						window.sctpClient.get_link_content(identifiers[0][2], 'string')
							.done(function (content) {

								container
									.append($('<option sc_addr="'
										+ identifiers[0][0] + '">' + content + '</option>'));
							});
					});
			}

		});
	},

	_fillBooksList: function () {
		SCWeb.core.Server.resolveScAddr(['book', 'nrel_main_idtf', 'concept_book'],
			function (resolvedKeynodes) {
				var book_addr = resolvedKeynodes['book'];
				var concept_book_addr = resolvedKeynodes['concept_book'];
				var nrel_main_idtf_addr = resolvedKeynodes['nrel_main_idtf'];
				var book_select_list = $('#book_select')
				SimilarBooks.Painter.prototype._appendSet(book_select_list,book_addr, nrel_main_idtf_addr);

				SimilarBooks.Painter.prototype._appendSet(book_select_list,concept_book_addr, nrel_main_idtf_addr);
			});
	},

	_fillAuthorsList: function () {
		SCWeb.core.Server.resolveScAddr(['nrel_main_idtf', 'concept_writer', 'writer'],
			function (resolvedKeynodes) {
				var writer_addr = resolvedKeynodes['writer']
				var concept_writer_addr = resolvedKeynodes['concept_writer'];
				var nrel_main_idtf_addr = resolvedKeynodes['nrel_main_idtf'];

				var writer_select_list = $('#author_select')
				SimilarBooks.Painter.prototype._appendSet(writer_select_list,concept_writer_addr, nrel_main_idtf_addr);
				SimilarBooks.Painter.prototype._appendSet(writer_select_list,writer_addr, nrel_main_idtf_addr);
			});
	},

	_formResult: function (cmd_addr, cmd_args) {
		var bookToSearch = cmd_args[0]
		SCWeb.core.Arguments.clear();
		SCWeb.core.Server.doCommand(cmd_addr, cmd_args, function (result) {
			if (result.question != undefined) {
				window.scHelper.getAnswer(result.question).done(function (answer) {

					window.scHelper.getSetElements(answer).then(function (answerElements) {
						//	var similarBooks = answerElements[0];
						//answerElements = answerElements.filter(e => e != bookToSearch)
						SCWeb.core.Server.resolveScAddr(['nrel_main_idtf', 'book', 'concept_book', 'nrel_sameness'],
							function (keynodes) {
								var nrel_main_idtf_addr = keynodes['nrel_main_idtf'];
								var concept_book = keynodes['concept_book']
								var book = keynodes['book'];
								var sameness = keynodes['nrel_sameness']

								answerElements = answerElements.filter(e => e != sameness && e != bookToSearch)
								if(answerElements.length == 0){
									$('#result').append('<li><b>Схожих книг не найдено!</b></li>');
								} else{
								answerElements.forEach(function (similarBook) {

									window.sctpClient.iterate_elements(SctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F, [
										similarBook,
										sc_type_arc_common | sc_type_const,
										sc_type_link,
										sc_type_arc_pos_const_perm,
										nrel_main_idtf_addr])
										.done(function (identifiers) {
											window.sctpClient.get_link_content(identifiers[0][2], 'string')
												.done(function (content) {
													$('#result')
														.append('<li><a href="#" class="scs-scn-element scs-scn-field scs-scn-highlighted" sc_addr="'
															+ identifiers[0][0] + '">' + content + '</a></li>');
															$('#result_div').show()
												});
										})
								})
							}
							});
					}, function(){
						$('#result').append('<li><b>Схожих книг не найдено!</b></li>');
						$('#result_div').show()
					})
				})
			} else {
				alert("There are no any answer. Try another request");
			}
		});
	},

	_formRecommendResult: function (cmd_addr, cmd_args) {
		var bookToSearch = cmd_args[0]
		SCWeb.core.Arguments.clear();
		SCWeb.core.Server.doCommand(cmd_addr, cmd_args, function (result) {
			if (result.question != undefined) {
				window.scHelper.getAnswer(result.question).done(function (answer) {

					window.scHelper.getSetElements(answer).then(function (answerElements) {
						SCWeb.core.Server.resolveScAddr(['nrel_main_idtf' ],
							function (keynodes) {
								var nrel_main_idtf_addr = keynodes['nrel_main_idtf'];

								if(answerElements.length == 0){

									$('#recommend_title').text("Рекомендаций не найдено!");
									$('#recommend_title').show();
									$('#recommend_result_div').show()
								} else{
								answerElements.forEach(function (recommendedBook) {

									window.sctpClient.iterate_elements(SctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F, [
										recommendedBook,
										sc_type_arc_common | sc_type_const,
										sc_type_link,
										sc_type_arc_pos_const_perm,
										nrel_main_idtf_addr])
										.done(function (identifiers) {
											window.sctpClient.get_link_content(identifiers[0][2], 'string')
												.done(function (content) {

													$('#recommend_title').text("Рекомендовано к прочтению:");
													$('#recommend_title').show();
													$('#result_recommend')
														.append('<li><a href="#" class="scs-scn-element scs-scn-field scs-scn-highlighted" sc_addr="'
															+ identifiers[0][0] + '">' + content + '</a></li>');
															$('#recommend_result_div').show()
												});
										})
								})
							}
							});
					}, function(){
						$('#recommend_title').text("Рекомендаций не найдено!");
						$('#recommend_result_div').show()
					})
				})
			} else {
				alert("There are no any answer. Try another request");
			}
		});
	},

	_searchSimilarBooks: function () {
		// initiate ui_menu_search_book_by_template command
		var self = this;
		SCWeb.core.Server.resolveScAddr(['ui_menu_file_for_finding_similar_books'],
			function (resolvedKeynodes) {

				var command = resolvedKeynodes['ui_menu_file_for_finding_similar_books'];
				var book_addr = $('#book_select').find('option:selected').attr('sc_addr');
				self._formResult(command, [book_addr])

			})

	},
	
	_recommendBooks: function () {
		// initiate ui_menu_search_book_by_template command
		var self = this;
		SCWeb.core.Server.resolveScAddr(['ui_menu_file_for_recommending_books'],
			function (resolvedKeynodes) {

				var command = resolvedKeynodes['ui_menu_file_for_recommending_books'];
				var author_addr = $('#author_select').find('option:selected').attr('sc_addr');
				self._formRecommendResult(command, [author_addr])

			})

	}

};

/* --- src/similar-books-component.js --- */
/**
 * SimilarBooks component.
 */
SimilarBooks.DrawComponent = {
    ext_lang: 'similar_books_view',
    formats: ['format_similar_books'],
    struct_support: true,
    factory: function (sandbox) {
        return new SimilarBooks.DrawWindow(sandbox);
    }
};

SimilarBooks.DrawWindow = function (sandbox) {
    this.sandbox = sandbox;
    this.paintPanel = new SimilarBooks.Painter(this.sandbox.container);
    this.paintPanel.init();
    this.recieveData = function (data) {
        console.log("in recieve data" + data);
    };

    var scElements = {};

    function drawAllElements() {
        var dfd = new jQuery.Deferred();
       // for (var addr in scElements) {
            jQuery.each(scElements, function(j, val){
                var obj = scElements[j];
                if (!obj || obj.translated) return;
// check if object is an arc
                if (obj.data.type & sc_type_arc_pos_const_perm) {
                    var begin = obj.data.begin;
                    var end = obj.data.end;
                    // logic for component update should go here
                }

        });
        SCWeb.ui.Locker.hide();
        dfd.resolve();
        return dfd.promise();
    }

// resolve keynodes
    var self = this;
    this.needUpdate = false;
    this.requestUpdate = function () {
        var updateVisual = function () {
// check if object is an arc
            var dfd1 = drawAllElements();
            dfd1.done(function (r) {
                return;
            });


/// @todo: Don't update if there are no new elements
            window.clearTimeout(self.structTimeout);
            delete self.structTimeout;
            if (self.needUpdate)
                self.requestUpdate();
            return dfd1.promise();
        };
        self.needUpdate = true;
        if (!self.structTimeout) {
            self.needUpdate = false;
            SCWeb.ui.Locker.show();
            self.structTimeout = window.setTimeout(updateVisual, 1000);
        }
    }
    
    this.eventStructUpdate = function (added, element, arc) {
        window.sctpClient.get_arc(arc).done(function (r) {
            var addr = r[1];
            window.sctpClient.get_element_type(addr).done(function (t) {
                var type = t;
                var obj = new Object();
                obj.data = new Object();
                obj.data.type = type;
                obj.data.addr = addr;
                if (type & sc_type_arc_mask) {
                    window.sctpClient.get_arc(addr).done(function (a) {
                        obj.data.begin = a[0];
                        obj.data.end = a[1];
                        scElements[addr] = obj;
                        self.requestUpdate();
                    });
                }
            });
        });
    };
// delegate event handlers
    this.sandbox.eventDataAppend = $.proxy(this.receiveData, this);
    this.sandbox.eventStructUpdate = $.proxy(this.eventStructUpdate, this);
    this.sandbox.updateContent();
};
SCWeb.core.ComponentManager.appendComponentInitialize(SimilarBooks.DrawComponent);

