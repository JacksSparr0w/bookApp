
TagCloud.Painter = function (containerId) {
    this.containerId = containerId;
};

TagCloud.Painter.prototype = {

    init: function () {
        this._initMarkup(this.containerId);
        
    },

    _initMarkup: function (containerId) {
        var container = $('#' + containerId);

        var self = this;
        
	    $('#window-header-tools').append('<div id="cloudCanvasContainer"><canvas width="250" height="250" id="cloudCanvas"></canvas></div>')

       $('#window-header-tools').append('<div id="tags"><ul></ul></div>');
	       container.append('<button id="showCloud" type="button" class="btn btn-info sc-no-default-cmd">Показать облако тегов</button>')
	       container.append('<button id="hideCloud" type="button" class="btn btn-danger sc-no-default-cmd">Скрыть</button>')
	       container.append('<button type="button" class="btn btn-default btn-xs spoiler-trigger">Настройки</button><div class="panel panel-default spoiler-body" style="display: none;" id="settings"></div>')
			$(".spoiler-trigger").click(function() {
				$('.spoiler-body').toggle();
			});

			$("#settings").css({"width":"200px","display":"flex", "justify-content":"center"});
			$("#showCloud", "#hideCloud", "#settings").css("margin", "5px 0");
			$("label[for='maxSizeSlider']").css("margin-top", "15px");
			$('#reload').css({"margin-top":"15px", "margin-bottom":"5px"});
			var settings = $("#settings");
			settings.append('<div><p>Категории</p><div><input type="checkbox" id="book" checked/><label for="book" checked>Книги</label></div><div><input type="checkbox" id="person" checked/><label for="concept_person">Личности</label></div><div><label for="maxSizeSlider">Максимум тегов</label><input id= "maxSizeSlider" type="range" min="10" max="100" value="20"></div><div><button id="reload" type="button" class="btn btn-success sc-no-default-cmd" style="display: none;">Обновить</button></div></div>')

			if($('#tags ul li').length){
				$('#hideCloud').prop("disabled",false);
				$('#showCloud').prop("disabled",true);

				$('#reload').show();
			} else{
				$('#hideCloud').prop("disabled",true);
				$('#showCloud').prop("disabled",false);

				$('#reload').hide();

			}
			$('#reload').click(function(){

	 			$('#tags ul').empty();
		 		$('#cloudCanvas').tagcanvas({
					textColour: '#337ab7',
					outlineColour: '#71ad55',
					reverse: true,
					depth: 0.8,
					maxSpeed: 0.05},
					'tags');
	 			$('#cloudCanvasContainer').show();
				self._showCloud();

	 		})
		$('#showCloud').click(function(){
				$('#tags ul').empty();
		 		$('#cloudCanvas').tagcanvas({
					textColour: '#337ab7',
					outlineColour: '#71ad55',
					reverse: true,
					depth: 0.8,
					maxSpeed: 0.05},
					'tags');
	 			$('#cloudCanvasContainer').show();
				self._showCloud();
	 			$(this).prop("disabled",true);
				$('#reload').show();
	 			$('#hideCloud').prop("disabled",false);

	 		})
	 		
	 	$('#hideCloud').click(function(){
	 			$('#cloudCanvasContainer').hide();
	 			$('#reload').hide();
	 			
	 			$('#tags ul').empty();
	 			$('.spoiler-body').hide();	
	 			$(this).prop("disabled",true);
	 			$('#showCloud').prop("disabled",false);

	 	})
	 	
 		
    },

	_showCloud: function(){
		 var maxSize = $("#maxSizeSlider").val();
       var sc_elements_cmd_selector = '[sc_addr]:not(.sc-window, .sc-no-default-cmd, .btn-group)';
            $('#tags').delegate(sc_elements_cmd_selector, 'click', function (e) {
                if (!SCWeb.ui.ArgumentsPanel.isArgumentAddState()) {
                	e.stopPropagation();
                    SCWeb.core.Main.doDefaultCommand([$(e.currentTarget).attr('sc_addr')]);
                    
                }
            });
		SCWeb.core.Server.resolveScAddr(['book', 'nrel_main_idtf', 'concept_person', 'concept_book', 'person'],
			function (keynodes) {
				var book_addr = keynodes['book'];
				var concept_book_addr = keynodes['concept_book'];
				var person_addr = keynodes['person'];
				var concept_person_addr = keynodes['concept_person'];
				var nrel_main_idtf_addr = keynodes['nrel_main_idtf'];
				var checkedSize = $("#settings").find(':checkbox:checked').length;
				var size = maxSize/checkedSize;
				$( ":checkbox" ).each(function(){
					if($(this).is(':checked')){
						var id = $(this).prop('id');
						var addr = keynodes[id];
						var concept_addr = keynodes["concept_"+id];
						TagCloud.Painter.prototype._appendSet(addr, nrel_main_idtf_addr, size);
						TagCloud.Painter.prototype._appendSet(concept_addr, nrel_main_idtf_addr, size);
					}
				})
		});
	
						
	}, 
	_appendSet: function(set_addr,nrel_main_idtf_addr, size){
		if(typeof set_addr == 'undefined'){
			return;
		}
		window.scHelper.getSetElements(set_addr).done(function(elements){

				var minSize = size;
				if(minSize>elements.length){
					minSize = elements.length
				}
				for(var el = 0; el<minSize; el++) {

					element = elements[el];
					window.sctpClient.iterate_elements(SctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F, [
										 				element,
										 				sc_type_arc_common | sc_type_const,
										 				sc_type_link,
										 				sc_type_arc_pos_const_perm,
										 				nrel_main_idtf_addr])
	 				.done(function(identifiers){
	 					 window.sctpClient.get_link_content(identifiers[0][2],'string')
	 					 	.done(function(content){
	 					 	
		 					 	 $('#tags ul')
		 					 	.append('<li><a href="#" class="scs-scn-element scs-scn-field scs-scn-highlighted" sc_addr="'
		 					 		+identifiers[0][0]+'">'+content+'</a></li>');

		 					 	 $('#cloudCanvas').tagcanvas({
								          		textColour: '#337ab7',
								          		outlineColour: '#71ad55',
								          		reverse: true,
								          		depth: 0.8,
								          		maxSpeed: 0.05},
								          		'tags');
		 					});
	 				});
				}
			
				});
	}
};
