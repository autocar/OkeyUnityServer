var exports = module.exports = {};
var Mysql = require('./MysqlConnection.js');
var GameCards = require('./GameCards.js');

var Game = function(){
    if(!(this instanceof Game)){
        return new Game();
    }
    
    var Deal = function(gameId, playersId){
        var gameCards = new GameCards(gameId);
        var cardToDeal = gameCards.StackDraw(56, function(cardToDeal){
            var playersCard = [[],[],[],[]];
            for(var i=0; i<14; i++){
                for(var playerNum=0; playerNum<4 ;playerNum++){
                    playersCard[playerNum].push(cardToDeal.pop());
                }
            }
            for(var i=0;i<4;i++){
                var playerHand = [[],[]];
                for(var j=0;j<12;j++){
                    playerHand[0].push(playersCard[i].pop());
                    playerHand[1].push({color:'empty',number:'empty'});
                }
                playerHand[1][0] = playersCard[i].pop();
                playerHand[1][1] = playersCard[i].pop();
                
                var data = {hand: JSON.stringify(playerHand)};
                var cond = "game_id="+gameId+" AND player_id='"+playersId[i]+"'";
                var mysql = new Mysql();
                mysql.Update("player", data, cond, function(err){
                    if(err) throw err;
                });
            }

        });
    }

    var OrderUpdate  = function(gameId){
        var orderUpdateSql = new Mysql();
        orderUpdateSql.Update("game",{current_order: 1}, "game_id="+gameId, function(err){
            if(err) throw err;
        });
        
    };

    var DiscardInit = function(gameId){
        var mysql = new Mysql();
        data = {
            p1: '[]',
            p2: '[]',
            p3: '[]',
            p4: '[]'
        };
        mysql.Update("discard", data, "game_id="+gameId, function(err){
            if(err) throw err;
        });
    };

    var GetCurrentOrder = function(gameId, callback){
        var mysql = new Mysql();
        mysql.Select("game", ["current_order"], "game_id="+gameId,function(err, results){
            callback(err, results);
        });
    }


    var GetPlayerCard = function(gameId, playerOrder, callback){
        var mysql = new Mysql();
        mysql.Select("player", ['hand'], "game_id="+gameId+" AND player_order="+playerOrder, function(err, hand){
            if(err) {
                throw err;
            } else {
                var discardSql = new Mysql();
                var lastPlayerOrder = playerOrder==1 ? 4:playerOrder-1
                var col = "p"+lastPlayerOrder;
                discardSql.Select("discard", [col], "game_id="+gameId, function(err, discard){
                    if(err){
                        throw err;
                    } else {
                        var cards = JSON.parse(discard[0]['p'+lastPlayerOrder]);
                        if(discard.length == 0){
                            callback(new Error("Can's get discard"), hand, discard);
                        } else if(cards.length == 0){
                            callback(err, JSON.parse(hand[0]['hand']), {color: "empty", number: "empty"});
                        } else{
                            callback(err, JSON.parse(hand[0]['hand']), cards.pop());
                        }
                    }
                });
            }
        });

    }

    that = {};
    
    that.Start = function(gameId,callback){
        var mysql = new Mysql();
        mysql.Select("player", ["player_id"], "game_id="+gameId,function(err, results){
            if(err){ 
                throw err;
            }else{
                if(results.length != 4) callback(new Error("No enough player"));
                var playersId = [];
                console.log(results);
                for(var i in results){
                    playersId.push(results[i]['player_id']);
                }
                Deal(gameId,playersId);
                OrderUpdate(gameId);
                DiscardInit(gameId);
                callback(err);
            }
        });
    }
    
    that.CurrentPlayer = function(gameId, callback){
        GetCurrentOrder(gameId, function(err, results){
            if(err){
                throw err;
            } else {
                if(results.length == 0){
                    return callback(new Error("Can't get order",""));
                } else{
                    return callback(err, results[0]['current_order']);
                }
            }
        });
    }

    that.GetCurrentState = function(gameId, callback){
        that.CurrentPlayer(gameId, function(err, currentPlayer){
            if(err) throw err;
            GetPlayerCard(gameId, currentPlayer, function(err, hand, discard){
                if(err){
                    throw err;
                } else{
                    callback(err, currentPlayer, hand, discard);
                }
            });
        });
    }

    that.NextState = function(gameId){
        that.CurrentPlayer(gameId, function(err, currentPlayer){
            if(err){
                throw err;
            } else {
                var mysql = new Mysql();
                var nextPlayerOrder = currentPlayer==4? 1:currentPlayer+1;
                mysql.Update("game", {current_order: nextPlayerOrder}, "game_id="+gameId, function(err){
                    if(err) throw err;
                });
            }
        });
    }

    return that;

};
module.exports = Game;
/*var game = new Game();
game.Start(20163031557860, function(err){
    if(err) throw err;
});*/
