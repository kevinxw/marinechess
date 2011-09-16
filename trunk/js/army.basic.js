/* 棋盘position:
0  1  2  3  4
5  6  7  8  9
10 11 12 13 14
15 16 17 18 19 
20 21 22 23 24 
25 26 27 28 29 

30 31 32 33 34
35 36 37 38 39
40 41 42 43 44
45 46 47 48 49
50 51 52 53 54
55 56 57 58 59
*/

//其实理想状态应该使用x,y的坐标形式,但是因为自己懒得改,所以还是沿用了webbang原先的坐标

var Army = {};
Army.cfg = {
    //行营位置
    protect: [11,13,17,21,23,36,38,42,46,48],
	//大本营位置
	homeProtect : [1,3,56,58],
	
    //棋子在棋盘上的css位置，cssPosHori为left, cssPosVer为top
    cssPosHori: [10,104,198,293,386],
    cssPosVer:  [12,59,107,155,202,250,350,398,445,493,541,588],
	
    /* 存在棋子的data
    * pos: 在棋盘上的位置，与棋盘矩阵对应
    * role: 角色号码
    *       0-炸弹 1-司令 2-军长 3-师长 4-旅长 5-团长 6-营长 7-连长 8-排长 9-工兵 10-地雷 11-军旗
    * group: 0-黑方 1-红方
    * status: 是否已揭开 0-未揭 1-揭开
    * */
    pieces_role_arr: [0,0,1,2,3,3,4,4,5,5,6,6,7,7,7,8,8,8,9,9,9,10,10,10,11],
    
    //棋盘上的六条快速通道
    leftVer: [5,10,15,20,25,30,35,40,45,50],
    rightVer: [9,14,19,24,29,34,39,44,49,54],
    hori1: [5,6,7,8,9],
    hori2: [25,26,27,28,29],
    hori3: [30,31,32,33,34],
    hori4: [50,51,52,53,54],
	cross: [5,9,25,27,29,30,32,34,50,54],

	cross : {
		//分别定义六条通道上的拐点
		leftVer : [5,50],
		rightVer: [9,54],
		hori1: [5,9],
		hori2: [25,27,29],
		hori3: [30,32,34],
		hori4: [50,54]
	},

	//指令集合
	cmd : {
		//棋子移动
		move : /^#(\d+)->@(\d+)$/,
		//棋子移动的回滚操作
		roll : /^~#(\d+)->@(\d+)$/,
		//翻棋
		turnOver : /^\?(\d+)$/,
		//棋子复活
		relive : /^!(\d+)$/,
		//所有历史
		history : /^history:(~?[\?#!]+\d+(?:->@\d+)?)*$/i,
		//附加历史
		appendHistory : /^\+history:(~?[\?#!]+\d+(?:->@\d+)?)*$/i
	}
}

//棋盘上每一个位置可以走到的步法
Army.cfg.step = {
    "5": Army.cfg.leftVer.concat(Army.cfg.hori1, [0,11]),
    "25": Army.cfg.leftVer.concat(Army.cfg.hori2, 21),
    "9": Army.cfg.rightVer.concat(Army.cfg.hori1, [4,13]),
    "29": Army.cfg.rightVer.concat(Army.cfg.hori2, 23),
    "30": Army.cfg.leftVer.concat(Army.cfg.hori3, 36),
    "50": Army.cfg.leftVer.concat(Army.cfg.hori4, [46,55]),
    "34": Army.cfg.rightVer.concat(Army.cfg.hori3, 38),
    "54": Army.cfg.rightVer.concat(Army.cfg.hori4, [48,59]),

    "10": Army.cfg.leftVer.concat(11),
    "15": Army.cfg.leftVer.concat([11,16,21]),
    "20": Army.cfg.leftVer.concat(21),
    "35": Army.cfg.leftVer.concat(36),
    "40": Army.cfg.leftVer.concat([36,41,46]),
    "45": Army.cfg.leftVer.concat(46),
    "14": Army.cfg.rightVer.concat(13),
    "19": Army.cfg.rightVer.concat([13,18,23]),
    "24": Army.cfg.rightVer.concat(23),
    "39": Army.cfg.rightVer.concat(38),
    "44": Army.cfg.rightVer.concat(38,43,48),
    "49": Army.cfg.rightVer.concat(48),

    "6": Army.cfg.hori1.concat([1,11]),
    "7": Army.cfg.hori1.concat([2,11,12,13]),
    "8": Army.cfg.hori1.concat([3,13]),
    "26": Army.cfg.hori2.concat(21),
    "27": Army.cfg.hori2.concat([32,22,21,23]),
    "28": Army.cfg.hori2.concat(23),
    "31": Army.cfg.hori3.concat(36),
    "32": Army.cfg.hori3.concat([27,36,37,38]),
    "33": Army.cfg.hori3.concat(38),
    "51": Army.cfg.hori4.concat([56,46]),
    "52": Army.cfg.hori4.concat([57,46,47,48]),
    "53": Army.cfg.hori4.concat([58,48]),

    "0": [1,5],
    "1": [0,2,6],
    "2": [1,3,7],
    "3": [2,4,8],
    "4": [3,9],
    "11": [5,6,7,10,12,15,16,17],
    "12": [7,11,13,17],
    "13": [7,8,9,12,14,17,18,19],
    "16": [11,15,17,21],
    "17": [11,12,13,16,18,21,22,23],
    "18": [13,17,19,23],
    "21": [15,16,17,20,22,25,26,27],
    "22": [17,21,23,27],
    "23": [17,18,19,22,24,27,28,29],
    "36": [30,31,32,35,37,40,41,42],
    "37": [32,36,38,42],
    "38": [32,33,34,37,39,42,43,44],
    "41": [36,40,42,46],
    "42": [36,37,38,41,43,46,47,48],
    "43": [38,42,44,48],
    "46": [40,41,42,45,47,50,51,52],
    "47": [42,46,48,52],
    "48": [42,43,44,47,49,52,53,54],
    "55": [50,56],
    "56": [51,55,57],
    "57": [52,56,58],
    "58": [53,57,59],
    "59": [54,58]
}

Army.init = {
    //初始化，重置所有参数
    startInit: function(){
		$(".space").remove();
		$(".pieces").remove();
		$(".pieces_c").remove();
		$(".pieces_selected").remove();
		$("#killedPieces0 .killedPieces_item").remove();
		$("#killedPieces1 .killedPieces_item").remove();
    },
    /* 
     * 创建棋盘上每个位置的按钮
     * */
    createSpace: function(board){
		for (var i=0; i<5; i++) {
			for (var j=0; j<12; j++){
				var pos = j*5+i;
				$("<span>", {
					"class": "space",
					css: {
						top: Army.cfg.cssPosVer[j],
						left: Army.cfg.cssPosHori[i]
                    }
					})
					//只记录pos数据
					.data("pos", pos)
					.appendTo(board)
					.click(function () {
						//只有当捡起棋的时候才有此步操作
						var picked =new  Army.Chessman();
						if (!Army.Chessman.isId(picked.id))
							return false;
						var cmd = picked.move(new Army.Chessman('@'+$(this).data("pos")));
						var arg = Army.Judge(cmd);
						if (arg) {
							//注意UI显示要在数据提交前面
							Army.UI(cmd,arg);
							$(".pieces_selected").removeClass("pieces_selected");
							Army.Chessman.commit();
							(new Army.Player()).sleep(Army.Judge.callBack);
						}
						else {
							Army.Chessman.rollback();
						}
					});
            }
        }
    },

    /*
     * 摆放棋子
     * */
    createPieces: function(board) {
		var allpieces = [];
		//棋子

		for (var i=0; i<Army.Judge.turns.length;i++)
			for (var j=0;j<Army.cfg.pieces_role_arr.length;j++)
				allpieces.push({
					//id其实是个随意的数字,只要保证不重复即可
					id : i*50+j,
					level : Army.cfg.pieces_role_arr[j],
					player : Army.Judge.turns[i],
					status : 0
				});
		
		//这里仍然限制为双方对战
		//摆放60个棋子
		for (var i = 0; i < 60; i++) {
			//行营处不放棋子
			if ($.inArray(i, Army.cfg.protect) > -1) {
				Army.UI.board[i]=null;
				continue;
			}
            
			//随机抽取棋子
			var j = Math.min(Math.floor(Math.random()*allpieces.length),allpieces.length-1);
			//创建棋子
			new Army.Chessman($.extend(allpieces.splice(j,1)[0],{"pos":i}));
			
			//棋子位置
			var cssPos = Army.UI.getCssPosByPos(i);
			
			//推入UI表
			Army.UI.board[i] = $("<span>", {
				"class": "pieces_c",
				css:{
					top: cssPos.top,
					left: cssPos.left,
					"z-index": 1
				}
				})
			.addClass("pieces")
			.appendTo(board)
			.data("pos", i)
			.click(function () {
				var self=$(this);
				var c=new Army.Chessman('@'+self.data("pos"));
				//当前用户
				var p=new Army.Player();
				//转移焦点
				$(".pieces_selected").removeClass("pieces_selected");
				//只有当前自己棋子才有捡起效果,同时两次点击同一棋子也将不会再添加上效果
				//这里的p.pick()还是上次的值,故UI操作必须放在这里
				if (Army.Judge.chessman.isCurTurn(c) && (p.pick().id!=c.id))
					self.addClass("pieces_selected");
				//翻棋操作
				var cmd = p.pick(c);
				var picked = p.pick();
				if (Army.Judge(cmd)) {
					Army.UI(cmd);
					p.sleep(Army.Judge.callBack);
				}
				//只有当捡起棋的时候才有此步操作
				else if (Army.Chessman.isId(picked.id)) {
					cmd = picked.move(c);
					//alert(cmd);
					var arg = Army.Judge(cmd);
					if (arg) {
						Army.UI(cmd,arg);
						Army.Chessman.commit();
						p.sleep(Army.Judge.callBack);
					}
					else
						Army.Chessman.rollback();
				}
			});
        }
   }
}