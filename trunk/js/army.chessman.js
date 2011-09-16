
//棋子对象
Army.Chessman = (function () {
	//私有全局变量

	//所有棋子集合
	var $$c = [];
	//所有未提交棋子数据的集合(成员是棋子)
	var $$uncommited = [];
	//位置数组,位置作为索引,其中保存的是棋子id
	var $$pos=[];
	//基本数据
	function basicdata() {
		return {
			"id" : null,
			"level" : null,
			"pos" : null,
			"player" : null,
			"status" : null
		};
	};
	
	/*
	 * 构造函数 $$g (global constructor)
	 * $d (data) : {
	 * 	id : 棋子id(用于标示棋子在棋局中的唯一性)
	 * 	level : 棋子等级
	 * 	pos : 坐标(pos==null时表示棋子死亡)
	 * 	player : 玩家
	 * 	status : 状态(-1-未初始化,0-未翻,1-已翻开)
	 * }
	 */
	var $$g = function ($d) {
		//实例成员
		$.extend(this,{
			//所有成员函数都会返回当前棋子对象,这样能将一串连续动作表达出来

			/*
			 * 死亡
			 * $c 表示凶犯,当前对象为被害者
			 * $arg 表示死法0/1/2
			 */
			 die : function ($c,$arg) {
				this.commit(function() {
					//当前位置被新棋子代替,虽然该操作已在move()中完成,这里再次赋null值是为了避免拼掉的情况
					if ($arg==1)
						$$pos[$d.pos]=null;
					$d.pos=null;
					//更新玩家当前棋数
					var p = new Army.Player($d.$$self);
					p.loseChessman($d.$$self);
					});
			 },
			 
			 /*
			 * 复活(多用于悔棋之类的情况)
			 */
			relive : function ($c) {
				$d.pos==(new $$g($c)).data("pos");
				$$pos[$d.pos]=$d.id;
			 },
			 
			 //翻开(return 0-失败,1-成功)
			turnOver : function () {
				this.commit(function () {
					$d.status=1;
					});
				return $d.status ? 0 : 1;
			 },
			 
			 /*
			 * 移动
			 * $c 为棋子对象
			 * 这个函数应该只发出指令并不进行判断,判断应该交给Judge
			 * 返回动作代码(格式:#棋子id->位置)
			 */
			 move : function ($c) {
				$c = new $$g($c);
				var pos = $c.data("pos");
				this.commit(function () {
					//移到新位置
					$$pos[$d.pos]=null;
					$d.pos = pos;
					$$pos[pos] = $d.id;
					});
				return '#'+$d.id+"->@"+pos;
			 },
			 
			 /*
			  * 回滚操作
			  */
			 rollback : function () {
				if ($$uncommited[this.id])
					delete $$uncommited[this.id];
				//返回上一步
				uncommited = [];
			 },
			  
			 /*
			  * 提交操作(提交数据修改,如果$func不为null则加入数组)
			  */
			 commit : function ($func) {
				if (!$func) {
					delete $$uncommited[this.id];
					for (;uncommited.length>0;)
						uncommited.shift().call(this);
				}
				else {
					if (!$$uncommited[this.id])
						//建立指针
						$$uncommited[this.id] = this;
					uncommited.push($func);
				}
			 },
			 
			 //获得数据
			 data : function ($item) {
				if (typeof $item=="string")
					return $d[$item];
				else
					//发送数据的拷贝
					return $.extend({} ,$d);
			 }
		});

		//局部变量
		var 
			uncommited = [];	//未提交操作
		
		//如果参数存在
		if ($d) {
			this.id = $d.id;
			$d.$$self = this;
		}
		
		return $$g.get($d);
		
	};
	
	return $.extend($$g,{
		//静态成员
		
		/*
		 * 根据对象或坐标位置获得棋子对象
		 * $c 为棋子对象/棋子坐标(坐标格式: @位置)/棋子id
		*/
		get : function ($c) {
			if ($c instanceof $$g)
				return $c;
			//根据id获得棋子
			else if (typeof $c=="number" || typeof $c=="string") {
				var r = /^\d+$/;
				if (r.test($c+''))
					return $$c[parseInt($c)] || null;
				//根据坐标获得棋子
				r = /^@(\d+)$/;
				//如果格式不对则返回空棋子
				if (!r.test($c)) 
					return  null;//new this($.extend({},basicdata()));
				//指定位置棋子id
				var pos = parseInt(r.exec($c)[1]);
				var cid = $$pos[pos];
				//如果棋子不存在,则返回一个只包括位置的对象
				return this.isId(cid) ? $$c[cid] : new this($.extend(basicdata(),{"pos":pos})) ;
			}
			else if ($c)
				return this.load($c);
			else if (typeof $c=='undefined')
				//如果没有参数则返回当前用户捡起的棋子
				return new this(Army.Player().pick());
			else
				return new this($.extend(basicdata(),{"pos":-1})) ;
		},
		
		//添加棋子(将场上棋子数据加入到集合中去,并不是从场下添加棋子)
		add : function ($c) {
			$c =new  this($c);
			//空白棋子不添加
			if (!$c.id && $c.id!=0)
				return $c;
			if (!$$c[$c.id])
				++$$c.length;
			$$c[$c.id]=$c;
			if ($c.data("pos") || $c.data("pos")==0)
				$$pos[$c.data("pos")]=$c.id;
			return $c;
		},
		
		//从数据加载棋子(只能从对象加载)
		load : function ($d) {
			//把传入的参数作为棋子数据
			$d = $d || basicdata();
			//整理数据
			//棋子初始化必须要求有具体的数据
			//try {
				//木有id/木有等级/木有玩家时,返回一枚空白棋子,即该位置不存在棋子
				if (!this.isId($d.id) || !this.isId($d.level) || !$d.player) {
					//如果连位置都木有,那就表示系统错误
					if (!this.isId($d.pos))
						alert("系统错误!");
						return null;
				}
				else {
					$d.id = parseInt($d.id);
					$d.player = $d.player.toLowerCase();
					$d.status = $d.status || 0;
				}
				//什么都可以木有,但是位置不能木有
				$d.pos = parseInt($d.pos) ;
			//}
			//catch (e) {
			//}
			
			return this.add($d.$$self);
			
		},
		
		//初始化对象,清空全局变量
		init : function () {
			$$pos=[];
			this.length=0;
			$$c=[];
		},
		
		//提交所有改动棋子的事务
		commit : function () {
			$.each($$uncommited,function ($i,$o) {
				if ($o)
					$o.commit.call($o);
			})
		},
	
		//回滚所有改动棋子的事务
		rollback : function () {
			$.each($$uncommited,function ($i,$o) {
				if ($o)
					$o.rollback.call($o);
			})
		},
		
		//返回位置信息
		pos : function ($n) {
			if (typeof $n=="number" || (typeof $n=="string" && /^\d+$/.test($n)))
				return $$pos[parseInt($n)] || null;
			else
				return $$pos.slice();
		},
		
		//是否合法id
		isId : function ($n) {
				return !!($n || $n==0);
		},
		
		//场上棋子数目(原有50颗)
		length : 0

	});
})();
