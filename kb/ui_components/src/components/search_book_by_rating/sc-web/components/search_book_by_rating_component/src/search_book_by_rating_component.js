SearchbookByRating = {
    ext_lang: 'search_book_by_rating_code',
    formats: ['format_search_book_by_rating_json'],
    struct_support: true,

    factory: function (sandbox) {
        return new setSearchbookByRatingViewerWindow(sandbox);
    }
};

var setSearchbookByRatingViewerWindow = function (sandbox) {

    var self = this;
    this.sandbox = sandbox;
    this.sandbox.container = sandbox.container;

    var inputFrom = '#series-tools-' + sandbox.container + " #series_from-input"

    var inputTo = '#series-tools-' + sandbox.container + " #series_to-input"

    var buttonFind = '#series-tools-' + sandbox.container + " #button-find-series";

    var keynodes = ['ui_search_book_by_rating_in_memory'];

    $('#' + sandbox.container).prepend('<div class="inputBox" id="series-tools-' + sandbox.container + '"></div>');
    $('#series-tools-' + sandbox.container).load('static/components/html/search_book_by_rating_component.html', function () {
        SCWeb.core.Server.resolveScAddr(keynodes, function (keynodes) {
            SCWeb.core.Server.resolveIdentifiers(keynodes, function (idf) {
                var buttonSearch = idf[keynodes['ui_search_book_by_rating_in_memory']];

                $(buttonFind).html(buttonSearch);
                $(buttonFind).click(function () {
                    var fromString = $(inputFrom).val();

                    var rtoString = $(inputTo).val();
                    
                    console.log("Book From " + fromString);
                    console.log("Book To " + rtoString);

                    if (fromString && rtoString) {
                        var searchParams = {
                            fromRating: fromString.toString(),
                            toRating: rtoString.toString()
                        };

                        findBookByRating(searchParams);
                    }
                });
            });
        });
    });

    this.applyTranslation = function (namesMap) {
        SCWeb.core.Server.resolveScAddr(keynodes, function (keynodes) {
            SCWeb.core.Server.resolveIdentifiers(keynodes, function (idf) {
                var buttonLoad = idf[keynodes['ui_search_book_by_rating_in_memory']];

                $(buttonFind).html(buttonLoad);
            });
        });
    };
    this.sandbox.eventApplyTranslation = $.proxy(this.applyTranslation, this);
};

SCWeb.core.ComponentManager.appendComponentInitialize(SearchbookByRating);

function findBookByRating(searchParams) {
    console.log(searchParams);
    
    SCWeb.core.Server.resolveScAddr([searchParams.fromRating, searchParams.toRating], function (keynodes) {
        //addr = 'Project_1';
        addr1 = keynodes[searchParams.fromRating];
        addr2 = keynodes[searchParams.toRating];
        console.log("addr1", addr1);
        console.log("addr2", addr2);
        console.log("arguments", SCWeb.core.Arguments._arguments);
        if (!addr1 && !addr2){
            return;
        }
        // Resolve sc-addr of ui_menu_view_full_semantic_neighborhood node
        SCWeb.core.Server.resolveScAddr(["ui_menu_file_for_finding_book_by_rating"], function (data) {
            // Get command of ui_menu_view_full_semantic_neighborhood
            var cmd = data["ui_menu_file_for_finding_book_by_rating"];
            console.log("cmd", cmd);
            // Simulate click on ui_menu_view_full_semantic_neighborhood button
            SCWeb.core.Main.doCommand(cmd, [addr1, addr2], function (result) {
                // waiting for result
                if (result.question != undefined) {
                    // append in history
                    consonle.log(result.question);
                    SCWeb.ui.WindowManager.appendHistoryItem(result.question);
                }
            });
        });
    });
}
