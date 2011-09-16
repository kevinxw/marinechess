//裁判
Army.Judge = (function () {

	var $$g = function ($d) {
		return Army.Judge.chessman($d);
	};

	return $.extend($$g,{
		//玩家的下棋顺序
		turns : [],
		curTurn : '',	//当前轮到玩家姓名
		cmd : [],	//历史命令
		gameOver : false,	//游戏是否结束
	
		//初始化
		init : function () {
			this.turns = [];
			this.curTurn = '';
			this.cmd = [];
		},
	
		//授予玩家传令,轮到该玩家下棋
		wake : function ($p) {
			var p = new Army.Player($p);
			$$g.curTurn = p.name;
			p.wake();
			//返回玩家
			return p;
		},

		//收到玩家的传令()
		callBack : function ($p) {
			//判断输赢,$p是当前玩家
			$.each($$g.turns,function ($i,$o) {
				var p=new Army.Player($o);
				if (p.data("status")==2) {
					//这里只判断的两方对战的情况
					$$g.gameOver = true;
					if (p.name==(new Army.Player()).name)
						alert("YOU LOSE!");
					else
						alert("YOU WIN!");
				}
			});
			//继续
			$$g.nextTurn();
		},
		
		//棋局开始
		start : function () {
			this.nextTurn();
		},
		
		//下一轮
		nextTurn : function () {
			//轮流执棋
			$$g.curTurn=new Army.Player($$g.turns.shift());
			$$g.turns.push(Army.UI.myTurn($$g.wake($$g.curTurn)));
			//修改标题
			document.title = Army.UI.title +'--当前玩家轮到['+$$g.curTurn+']';
		}
	});
})();

Army.Judge.chessman =  (function () {
	//私有全局变量
	
	//所有玩家对象集合
	$$act = [];
	
	//获得某条特定规则
	function getActionRule($act,$c1,$c2,$arg) {
		var act = Army.game.rule.chessman.action[$act];
		return (act[$c1.data("level")] ? act[$c1.data("level")] : act["general"]).call($c1,$c2,$arg);
	}

	/*
	 * 构造函数 $$g (global constructor)
	 * 1.Object $d (data) : {
	 * 	
	 * }
	 * 2.String
	 */
	var $$g = function ($d) {
		//实例成员
		//$.extend(this,{});

		//判断传入参数类型
		switch (typeof $d) {
			case "string" :
				if (Army.cfg.cmd.history.test($d))
					return $$g.history($d);
				else
					//字符串指令
					return $$g.judge($d);
			case "object" :
				return;
			//没有找到匹配指令
			default :
				return 0;
		}
	};
	
	return $.extend($$g,{
		//静态成员

		/*
		 * 碰棋
		 * return {
		 * 	hitStatus : hit的返回值
		 * 	path : []	移动过程
		 * }
		 * null表示失败
		 * $act 为棋子对象或棋子坐标
		 */
		judge : function ($act) {
			//如果游戏结束则全部指令失败(实际上后期版本中应该允许一部分操作,比如导入历史)
			if (Army.Judge.gameOver)
				return null;
			//判断是操作指令还是回滚指令
			var r1=Army.cfg.cmd.move,r2=Army.cfg.cmd.roll,r3=Army.cfg.cmd.turnOver;
			$act = $act ||'';
			//没有指令判做失败
			if (!$act)
				return null;
			//翻棋指令
			else if (r3.test($act)) {
				var c=r3.exec($act);
				var c1=new Army.Chessman(c[1]);
				//是否未翻
				if (c1.data("status")) {
					c1.rollback();
					return null;
				}
				c1.commit();
				Army.Judge.cmd.push($act);
				return {};
			}
			//回滚指令
			else if (r2.test($act)) {
				var c=r2.exec($act);
					
			}
			//操作指令
			else if (r1.test($act)) {
				var c=r1.exec($act);
				var c1=new Army.Chessman(c[1]);
				if (!this.isCurTurn(c1))
					return null;
				else if (c1.data("pos") == c[2])	//要移动的位置为当前位置
					return null;
				var c2=new Army.Chessman('@'+c[2]);
				//先判断是否可移动到此处,移动失败则回滚操作
				var path = getActionRule("move",c1,c2);
				if (!path) {
					return null;
				}
				//如果c2存在,则判断碰
				if (Army.Chessman.isId(c2.id)) {
					var hitStatus = getActionRule("hit",c1,c2);
					switch (hitStatus)  {
						case 0:
							getActionRule("die",c2,c1,0);
							break;
						case 1:
							getActionRule("die",c1,c2,1);
							getActionRule("die",c2,c1,1);
							break;
						case 2:
							//翻棋情况下不可以撞死
							return null;
							//getActionRule("die",c1,c2);
							break;
					}
					Army.Judge.cmd.push($act);
					return {
						"hitStatus" : hitStatus,
						"path" : path
						};
				}
				else {
					//直接移动
					Army.Judge.cmd.push($act);
					return {
						"path" : path
						};
				}
			}
			else
				//未找到匹配指令
				return null;
		},
		
		//是否当前轮玩家所执棋子
		isCurTurn : function ($c) {
			var p = new Army.Player(Army.Judge.curTurn);
			return ((new Army.Player($c)).name==p.name);
		}
	});
})();

//广度/深度优先算法($pos2为目标位置,$path为需要遍历的目标位置,$isDFS为是否深度优先,默认是广度优先)
Army.Judge.chessman.expressReachable = function ($pos1,$pos2,$isDFS) {
	var path=[],	//经过的拐点路径
		general = Army.game.rule.chessman.action.move.general,	//一般遍历函数
		expressAll = ','+Army.game.rule.map.expressVer.join(',')+','+Army.game.rule.map.expressHori.join(',')+',';
	//point记录需要遍历的节点
	for  (var  point=[$pos1],pos = $pos1,visited=[];point.length>0;pos = next(point)) {
		if (visited[pos])
			continue;
		var step = Army.cfg.step[pos];
		if (pos == $pos2)	//到达(此时并不关心该位置有没有棋子)
			return [];
		else {
			//将相邻路径推入数组
			for (var i=0;i<step.length;i++)
				//当前位置没有被堵塞
				if (expressAll.indexOf(','+step[i]+',')>-1 && !visited[step[i]] && !Army.Chessman.isId((new Army.Chessman('@'+step[i])).id))
					point.push(step[i]);
		}
		visited[pos]="visited";	//标记该位置已经被访问过
	}
	//只在拐点数组中有元素时返回path
	return path.length ? path : null;
	
	function next ($point) {
		if ($isDFS)
			return $point.shift();
		else
			return $point.pop();
	}
};

