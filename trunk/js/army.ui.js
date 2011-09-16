
//用户显示界面
Army.UI = (function () {

	//棋子UI
	var chessman = {
		//翻棋(位置)
		turnOver : function (id) {
			var c = new Army.Chessman(id),
				pos = c.data("pos"),
				bg_position = -(new Army.Player(c)).data("group")*60 + "px " + (-c.data("level")*30) + "px";
			Army.UI.board[pos].removeClass("pieces_c")
				.css("background-position", bg_position);
			$(".pieces_selected").removeClass("pieces_selected");
		},

		//move
		move : function ($id,$moveto,$arg) {
			//$moveto = parseInt($moveto);
			var c = new  Army.Chessman($id),
				aimC = new Army.Chessman('@'+$moveto),
				currPieces = $$g.board[c.data("pos")],
				aimPieces = $$g.board[$moveto],
				cssPos     = Army.UI.getCssPosByPos($moveto);
			
			$$g.board[c.data("pos")] = null;
			//alert(c.data("pos")+','+$moveto);
			//把棋子推入新位置新位置
			$$g.board[$moveto]  = 
				currPieces
				//置于最上层
				.css("z-index", 2)
				.animate({
					top: cssPos.top,
					left: cssPos.left,
					opacity : 0.75
					},"slow","linear", function(){
						//如果目标位置上有棋则自动触发die()
						if (Army.Chessman.isId(aimC.id)) {
							switch ($arg.hitStatus) {
								//win
								case 0:
									die(aimC,aimPieces);
									break;
								//tie
								case 1:
									die(c,currPieces);
									die(aimC,aimPieces);
									break;
								//die
								case 2:
									die(c,currPieces);
									break;
							}
						}
						//恢复原有层级
						currPieces.css("z-index", 1).css("opacity",1);
						
						//die
						 function die($c,$dom) {
							$dom.animate({
								opacity:"toggle"
								},"fast",function () {
									$dom.remove();
								});
							var p = new Army.Player($c),
								killed = $("#killedPieces"+p.data("group")) ,found = false;
							killed.find(".killedPieces_item").each(function(){
								var self= $(this);
								if (self.data("level") == $c.data("level")) {
									found = true;
									if (self.find("b").length > 0)
										self.find("b").text("X" + (parseInt(self.find("b").text().substr(1)) + 1) );
									else
										self.html("<b style=\"font-weight:bold;\">X2</b>");
								}
							});
							if (!found) {
								$("<span>", {
									"class": "killedPieces_item",
									css: {
										"background-position": -p.data("group")*60 + "px " + (-$c.data("level")*30) + "px"
									}
								})
								.appendTo(killed)
								.data("level",$c.data("level"))
							}
						 }
					})
					.data("pos", $moveto);
		}
	};

	//玩家UI
	var player = {
	};
	
	var $$g = function ($d,$arg) {
		return $$g.show($d,$arg);
	};

	return $.extend($$g,{
		title : "陆战军旗",	//窗口主标题
		//按钮数组,通过pos快速找到对应按钮
		board : [],
	
		/*
		 * 通过棋盘上的位置获取此位置上的css位置属性
		 * param: pos:棋盘上的位置
		 * return: obj.top & obj.left
		 * */
		getCssPosByPos: function(pos){
			var t = pos % 5;
			return {
				top: Army.cfg.cssPosVer[parseInt((pos)/5)],
				left: Army.cfg.cssPosHori[t]
			}
		},	//这个函数是原封不动
		
		//通过命令显示界面
		show : function ($cmd,$arg) {
			if (!$cmd)
				return;
			var cmd = Army.cfg.cmd,r;
			//翻棋
			if (cmd.turnOver.test($cmd)) {
				chessman.turnOver(cmd.turnOver.exec($cmd)[1]);
			}
			//移动
			else if (cmd.move.test($cmd)) {
				r = cmd.move.exec($cmd);
				chessman.move(r[1],parseInt(r[2]),$arg);
			}
		},
		
		//轮到当前用户的界面操作
		myTurn : function ($p) {
			$p = new Army.Player($p);
			return $p;
		}
	});
})();