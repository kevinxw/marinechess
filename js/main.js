$(function(){
	$("#fstHand").click(function(){
		_init(true);
		tb_remove(); 
		});
	$("#secHand").click(function(){
		_init(false);
		tb_remove(); 
		});
	$("#cancleStart").click(function(){
		tb_remove(); 
		});
	$("#descBtn").click(function(){
		$("#desc").toggle("normal"); 
		});
	$("#descCloseBtn").click(function(){
		$("#desc").fadeOut("normal"); 
	});
	
	/*
	 * isFstHand : 是否先手
	 * */
	function _init(isFstHand) {
		isFstHand = isFstHand ? true : false;
		var board = $("#board");
		Army.init.startInit();
		Army.Player.init();
		Army.Chessman.init();
		Army.Judge.init();
		//电脑先翻
		if (isFstHand)
			//添加顺序
			Army.Judge.turns = ["player1","player2"];
		else
			Army.Judge.turns = ["player2","player1"];
		//重构玩家
		$.each(Army.Judge.turns,function ($i,$p) {
			new Army.Player({
				name : $p,
				piece : Army.cfg.pieces_role_arr.slice(),
				group : $i%2,
				status : 1
			});
		});
		//设定当前玩家,注意玩家姓名需要小写
		Army.Player.curPlayer("player1");
		//以上初始化步骤要安排在createPieces前面,主要是根据player.name确定棋子归属
		Army.init.createSpace(board);
		Army.init.createPieces(board);
		//开始玩家轮询
		Army.Judge.start();

		//自动翻棋,for debug
		if (false) {
			for (var x in Army.UI.board)
				if (Army.UI.board[x])
					Army.UI.board[x].click();
		}
	}
});
