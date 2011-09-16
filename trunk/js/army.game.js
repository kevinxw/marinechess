
//游戏相关扩展
Army.game={};
Army.game.rule = {
	map : {
		//将所有快速通道连接起来
		expressVer : Army.cfg.leftVer.concat(Army.cfg.rightVer),
		expressHori : Army.cfg.hori1.concat(Army.cfg.hori2,Army.cfg.hori3,Army.cfg.hori4)
	},
	
	//棋子规则
	chessman : {
		action : {
			//碰棋规则
			hit : {
				//这里只返回状态码(return 0-大吃小,1-平,2-撞死)
				"general" : function ($c) {
					var ret=0;
					var l1=this.data("level"),l2=$c.data("level");
					if (l1>l2 || (l2==10 && l1!=9))
						ret = 2;	//撞死
					if (l1==l2 ||  l2==0) 	//等级相同或者一方是炸弹,没有使用else,使该结果可以替代以上结果
						//平
						ret = 1;
					return ret;
				},
				//炸弹
				"0" : function ($c) {
					//炸弹碰到任何棋子都平
					return 1;
				}
			},
			//死亡规则
			die : {
				//普通
				"general" : function ($c,$arg) {
					//普通死亡
					this.die($c,$arg);
				},
				//地雷
				"10" : function ($c,$arg) {
					//剩余地雷数减少
					this.die($c,$arg);
					//this.mineLeft--;
				},
				//军旗
				"11" : function ($c,$arg) {
					//战败
					this.die($c,$arg);
					//this.lose();
				}
			},
			//移动规则
			move : {
				//追踪路径(起始,递增,末尾,目标棋子)
				chasePath : function (start,stp,end,$c) {
					var path=[];
					for (var i=start+stp,id=Army.Chessman.pos(i);stp>0 ? (i<=end) : (i>=end);id=Army.Chessman.pos(i+=stp)) {
						//到达路径
						if (id==$c.id)
							return [];
						else if (Army.Chessman.isId(id)) 
							return null;
						else if ($.inArray(i,Army.cfg.cross)>-1)
							path.push(i);
					}
					return [];
				},
			
				//相同操作(本身棋子,目的棋子),返回是否成功
				common : function (c1,c2) {
					var ret = false;
					//相同位置,点的是自己
					if (c1.pos == c2.pos)
						;
					//大本营中不能移动
					//else if ($.inArray(c1.pos,Army.cfg.homeProtect)>-1)
					//	;
					//地雷与军旗不可移动
					else if (c1.level==10 || c1.level==11)
						;
					//同伙(.player加''以避免错误时undefined的情况)
					else if ((new Army.Player(c1.player+'')).data("group")==(new Army.Player(c2.player+'')).data("group"))
						;
					//行营中不能到达
					else if ($.inArray(c2.pos,Army.cfg.protect)>-1 && c2.id!=null)
						;
					//物理路径上不可达(未判断中间有棋子的情况)
					else if ($.inArray(c2.pos,Army.cfg.step[c1.pos])==-1) 
						;
					else
						ret  = true;
					//if (!ret)
					//	alert($.inArray(c2.pos,Army.cfg.step[c1.pos])==-1);
					return ret;
				},
				
				//普通(return null-失败,[]-成功返回pos数组轨迹)
				"general" : function ($c) {
					var act = Army.game.rule.chessman.action.move;
					var c1=this.data(),c2=$c.data();
					if (!act.common(c1,c2))
						return null;
					//追踪路径
					var path,line,start,end;
					//判断当前棋子是否在快速通道
					if ($.inArray(c1.pos,Army.game.rule.map.expressVer)>-1) {
						//判断当前棋子所在的快速通道(左侧快速通道可以被5整除)
						if (c1.pos%5==0) {
							line = "leftVer";
							start=5;
							end=50;
						}
						else {
							line = "rightVer";
							start=4;
							end=49;
						}
						//路线中有棋子则无法移动
						if ($.inArray(c2.pos,Army.cfg[line])>-1) {
							//目标在下方,则向下移动
							if (c1.pos < c2.pos)
								path = act.chasePath(c1.pos,5,end,$c);
							else
								path = act.chasePath(c1.pos,-5,start,$c);
							return path;
						}
					}
					if ($.inArray(c1.pos,Army.game.rule.map.expressHori)>-1) {
						switch (Math.floor(c1.pos/5)) {
							case 1:
								line = "hori1";
								start=5;
								end=9;
								break;
							case 5:
								line = "hori2";
								start=25;
								end=29;
								break;
							case 6:
								line = "hori3";
								start=30;
								end=34;
								break;
							case 10:
								line = "hori4";
								start=50;
								end=54;
								break;
						}
						//路线中有棋子则无法移动
						if ($.inArray(c2.pos,Army.cfg[line])>-1) {
							if (c1.pos < c2.pos)
								path = act.chasePath(c1.pos,1,end,$c);
							else
								path = act.chasePath(c1.pos,-1,start,$c);
							return path;
						}
					}
					//直接相连
					return [];
				},
				//工兵
				"9" : function ($c) {
					var c1=this.data(),c2=$c.data();
					//先测试普通走法
					var path =  Army.game.rule.chessman.action.move.general.call(this,$c);
					if (path)
						return path;
					//如果正常途径无法到达,则开始测试工兵的走法
					//1.工兵不在铁道上或对方不在铁道上
					var express = ','+Army.game.rule.map.expressVer.concat(Army.game.rule.map.expressHori).join(',')+',';
					if  (express.indexOf(','+c1.pos+',')==-1 || express.indexOf(','+c2.pos+',')==-1) 
						return null;
					//2.开始用深度优先计算最短路径
					//(为什么不用广度优先?因为广度优先难以记录轨迹的拐点)
					//同时,也没有使用流行的A*,是有当前的地图格式决定的(pos为数字却不是x,y)
					return Army.Judge.chessman.expressReachable(c1.pos,c2.pos);
				}
			}
		}
	}
};
