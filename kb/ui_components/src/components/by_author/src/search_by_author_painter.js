SearchByAuthor.PaintPanel = function (containerId) {
    this.containerId = containerId;
};

SearchByAuthor.PaintPanel.prototype = {

    init: function () {
        this._initMarkup(this.containerId);
    },

    _initMarkup: function (containerId) {
        var container = $('#' + containerId);

        var self = this;
        self._prepareLiteratureHistory(self, container)

    },

    _prepareLiteratureHistory: function(self, container) {
        var addrs = ['section_subject_domain_of_history_of_literature', 'nrel_section_decomposition', 'nrel_main_idtf']
        var section_history, nrel_decomposition, nrel_idtf

        SCWeb.core.Server.resolveScAddr( addrs, function (keynodes) {
            
            section_history = keynodes['section_subject_domain_of_history_of_literature']
            nrel_decomposition = keynodes['nrel_section_decomposition']
            nrel_idtf = keynodes['nrel_main_idtf']

            window.sctpClient.iterate_elements(SctpIteratorType.SCTP_ITERATOR_5A_A_F_A_F, [
                sc_type_const,
                sc_type_arc_common | sc_type_const,
                section_history,
                sc_type_arc_pos_const_perm,
                nrel_decomposition
            ]).done(function(history) {

                window.sctpClient.iterate_elements(SctpIteratorType.SCTP_ITERATOR_3F_A_A, [
                    history[0][0],
                    sc_type_arc_pos_const_perm,
                    sc_type_const
                ]).done(function (history_subsections) {                        
                    
                    for (let subsection_index = 0; subsection_index < history_subsections.length; subsection_index++) {

                        window.sctpClient.iterate_elements(SctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F, [
                            history_subsections[subsection_index][2],
                            sc_type_arc_common | sc_type_const,
                            sc_type_link,
                            sc_type_arc_pos_const_perm,
                            nrel_idtf
                        ]).done(function (history_subsection) {

                            window.sctpClient.get_link_content(history_subsection[0][2], 'string').done(function(history_subsection_content) {
                                var container_button = `<button id="${history_subsection[0][2]}" class="btn btn-info" type="button">${history_subsection_content}</button>`
                                container.append(`<div class="sc-no-default-cmd">${container_button}</div>`)

                                $(`#${history_subsection[0][2]}`).click(function() {
                                    self._addHistorySubsection(container, history_subsection[0][0])
                                })
                            })
                        })
                    }
                })
            })
        } )
    },

    _addHistorySubsection: function(container, history_subsection) {
    	var section_literature_of_modern_and_contemporary_times_addr, nrel_section_decomposition_addr
        var nrel_main_idtf_addr, nrel_system_identifiter_addr;
        var test;
    	
        SCWeb.core.Server.resolveScAddr([
            'section_literature_of_modern_and_contemporary_times', 
            'nrel_section_decomposition', 
            'nrel_main_idtf', 
            'nrel_systems_idtf',
            'section_literature_of_the_classicism'
            ], function (keynodes) {
                section_literature_of_modern_and_contemporary_times_addr = keynodes['section_literature_of_modern_and_contemporary_times'];
        		nrel_section_decomposition_addr = keynodes['nrel_section_decomposition'];
        		nrel_main_idtf_addr = keynodes['nrel_main_idtf'];
                nrel_system_identifiter_addr = keynodes['nrel_systems_idtf'];
                test = keynodes['section_literature_of_the_classicism']

        		window.sctpClient.iterate_elements(SctpIteratorType.SCTP_ITERATOR_5A_A_F_A_F, [
                    sc_type_const,
                    sc_type_arc_common | sc_type_const,
                    history_subsection,
                    sc_type_arc_pos_const_perm,
                    nrel_section_decomposition_addr
                ]).done(function (periods_set) {
    				
    				var periods_links = [], periods_idtfs = [];
    				for (var set_index = 0; set_index < periods_set.length; set_index++) {
    					
                        window.sctpClient.iterate_elements(SctpIteratorType.SCTP_ITERATOR_3F_A_A, [
                            periods_set[set_index][0],
                            sc_type_arc_pos_const_perm,
                            sc_type_const
                        ]).done(function (periods) {
                            
                            for (var period_index = 0; period_index < periods.length; period_index++) {

                                window.sctpClient.iterate_elements(SctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F, [
                                    periods[period_index][2],
                                    sc_type_arc_common | sc_type_const,
                                    sc_type_link,
                                    sc_type_arc_pos_const_perm,
                                    nrel_main_idtf_addr
                                ]).done(function (period) {

                                    window.sctpClient.get_link_content(period[0][2], 'string').done(function (content) {
                                        var html = "<button id=" + period[0][0] + " class=\"btn btn-link\" type=\"button\">" + content + "</button>"
                                        container.append(html)
                                        $("#" + period[0][0]).click(function () {
                                            SCWeb.core.Server.resolveScAddr(["ui_menu_find_set_of_books_by_author"], function (data) {
                                                var cmd = data["ui_menu_find_set_of_books_by_author"]
                                                SCWeb.core.Main.doCommand(cmd, [period[0][0]], function (result) {
                                                    if (result.question != undefined) {
                                                        SCWeb.ui.WindowManager.appendHistoryItem(result.question)
                                                    }
                                                })
                                            })
                                        })
                                    })
                                })
                            }
                        })  						
    				}
    			});
    	});
    },

    _handleClick: function(addr) {

    	console.log("asdasd");
		SCWeb.core.Server.resolveScAddr(["ui_menu_find_set_of_books_by_author"], function (data) {
			var cmd = data["ui_menu_find_set_of_books_by_author"];
			SCWeb.core.Main.doCommand(cmd,
			[addr], function (result) {
				if (result.question != undefined) {
					SCWeb.ui.WindowManager.appendHistoryItem(result.question);
				}
			});
		});
    },

};




