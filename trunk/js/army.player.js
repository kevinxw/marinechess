//面向对象的军旗

//code : id-棋子id/@pos位置/?id翻开棋子id/#id->@pos棋子移动到pos

//玩家对象
Army.Player = (function () {
	//私有全局变量
	
	//所有玩家对象集合
	var $$p = [];
	//当前玩家对象
	var currentPlayer = null;
	//返回基本数据
	function basicdata() {
		return {
			name : null,
			pieces : null,
			group : null,
			online : null,
			status : null
		};
	}
	
	/*
	 * 构造函数 $$g (global constructor)
	 * $d (data) : {
	 * 	name : 玩家姓名
	 * 	pieces : 用于记录当前用户剩余棋子数
	 * 	group : 组团,用于四国(或n国)军棋的扩展(0-个人)
	 * 	online : 在线情况(0-断线,1-在线)
	 * 	status : 战斗状态(0-观战,1-参战,2-战败)
	 * }
	 */
	var $$g = function ($d) {
		//实例成员
		$.extend(this,{
			/*
			 * 捡起棋子(只判断当前棋子是否可以捡起,不判断是否轮到本玩家,这种事情应该交给UI去做)
			 * $c 为棋子对象或棋子坐标
			 * $c为null时(即无参数时)返回pieceOnHand,即当前手持棋子,如没有执棋则返回null
			 * $c有值时返回指令(?id表示翻棋,返回空表示操作失败)
			 */
			pick : function ($c) {
				//探测$c是否有值而不探测pieceOnHand是否有值,避免玩家捡起新棋的情况
				if (Army.Chessman.isId($c))
					$c = new Army.Chessman($c);
				else if (Army.Chessman.isId(pieceOnHand)) 
					return new Army.Chessman(pieceOnHand);
				else
					return new Army.Chessman(null);
				//下面开始返回指令
				//翻棋
				if ($c.turnOver())
					return '?'+$c.id;
				//当前没有轮到该玩家
				else if (!Army.Judge.chessman.isCurTurn($c))
					return '';
				else if (pieceOnHand == $c.id) {
					pieceOnHand = null;	//两次点击相同则放下棋子
					return '';
				}
				else {
					//如果是己方棋子则捡起(返回空指令,因为并无实质性操作)
					pieceOnHand = $c.id;
					return '';
				}
			},
			
			/*
			 * 战败
			 */
			lose : function () {
				//只有参战情况下此函数有用
				if ($d.status!=1)
					return this;
				//状态标记为战败
				$d.status = 2;
			},
			
			//棋子死亡
			loseChessman : function ($c) {
				$c = new Army.Chessman($c);
				deadPiece.push($d.pieces.splice($.inArray($c.data("level"),$d.pieces),1)[0]);
				//确认战斗状态
				//军旗被挖或只剩军旗地雷(只判断非观战情况下)
				var curPieces = ','+$d.pieces.join(',')+',';
				if (curPieces.indexOf(',11,')==-1 || /^(?:,1(?:0|1))+,$/.test(curPieces))
					this.lose();	//死亡
			},
			
			//轮到下棋
			wake : function () {
				//如果有脑子,则叫醒脑子
				if (brain)
					brain.wake();
				return this;
			},
			
			//下完
			sleep : function ($callBack) {
				//放下棋子
				pieceOnHand = null;
				//回调函数
				if ($callBack)
					//把当前对象当作第一个参数传过去
					$callBack(this);
			},
			
			//加载AI
			putBrain : function ($b) {
				//注意$b应该是一个委托
				brain = new $b(this);
			},
			
			 //获得数据
			 data : function ($item) {
				if (typeof $item=="string")
					return $d[$item];
				else
					//发送数据的拷贝
					return $.extend({} ,$d);
			 },
			
			//玩家是否相等
			equals : function ($p) {
				return $$g.equals(this,$p);
			}
		});

		//如果当前参数存在
		if ($d) {
			this.name = $d.name;
			$d.$$self=this;
		}
		
		//局部变量
		var 
			brain = null, //AI,如果是玩家则为null(人多无脑- -)
			pieceOnHand = null,	//当前手上执棋
			deadPiece = [];	//死亡棋子
		
		return $$g.get($d);

	};
	
	return $.extend($$g,{
		//静态成员

		//添加玩家
		add : function ($p) {
			$p = this($p);
			if ($p && $p.name!="null")
				this.length = ++$$p.length;
			$$p[$p.name] = $p;
			return $p;
		},
		
		//删除玩家
		kill : function ($p) {
			$p = this($p);
			if ($p) {
				delete $$p[$p.name];
				this.length = --$$p.length;
			}
		},
		
		//获得玩家
		get : function ($p) {
			if ($p instanceof $$g)
				return $p;
			//通过棋子获得玩家
			else if ($p instanceof Army.Chessman) {
				return $$p[$p.data("player").toLowerCase()];
			}
			else if (typeof $p == "string" || typeof $p == "number")
				//传入名字为null时
				return $p=="null" ? new this({"name":"null"}) : $$p[($p+'').toLowerCase()];
			else if ($p)
				return this.load($p);
			else if (typeof $p=='undefined')
				//$p为undefined时返回当前玩家对象
				return this.curPlayer();
		},
		
		//加载玩家
		load : function ($d) {
			//把传入的参数作为玩家数据
			$d = $d || basicdata();
			//整理数据
			$d.name = /^\d+$/.test($d.name+'') ? 
				"木有名字"+$d.name :
				($d.name.toLowerCase() || (function () {
					for (var i=0;i<=$$p.length;i++)
						if (!$$p["木有名字"+(i+1)])
							return "木有名字"+(i+1);
				})());	//如果匿名则依次为各个用户编号
			$d.pieces = $d.pieces || Army.cfg.pieces_role_arr.slice();	//剩余棋子,默认为全部棋子
			//group为null表示独自一派,不与任何人结盟
			
			//计算死亡棋子
			var curPieces = ','+$d.pieces.join(',')+',';
			for (var i=0;i<Army.cfg.pieces_role_arr.length;i++)
				if (curPieces.indexOf(','+Army.cfg.pieces_role_arr[i]+',')!=-1)
					curPieces = curPieces.replace(','+Army.cfg.pieces_role_arr[i]+',',',');
				else
					deadPiece.push(Army.cfg.pieces_role_arr[i]);

			//将当前对象加入全局集合,使用姓名做索引
			return this.add($d.$$self);
		},
		
		//初始化
		init : function () {
			$$p=[];
			this.length=0;
		},
		
		//玩家是否相等
		equals : function ($p1,$p2) {
			return (this($p1).name == this($p2).name);
		},
		
		//当前玩家对象($p为null时返回当前玩家对象,否则更新当前玩家对象)
		curPlayer : function ($p) {
			if ($p)
				currentPlayer = this($p);
			else
				return currentPlayer;
		},
		
		//玩家数目
		length : 0
	});
})();

//错误对象(并未使用到,预留)
Army.Error = (function () {
	//错误数
	var errCount = 0;
	
	//(是否系统错误,错误号,错误名,错误消息)
	return function ($isSys,$name,$msg) {
		if ($isSys)
			errCount++;
		this.name = $name;
		this.description = this.message = $msg;
	}
})();

//Strategy