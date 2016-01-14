var oauth = require("cloud/libs/oauth.js");

function getTweetsNumber(params, count, lastID, isFirstPage){
    //console.log("getTweetsNumber");

    var urlLink = "https://api.twitter.com/1.1/search/tweets.json"+params;
    var consumerSecret = "xxx";
    var tokenSecret = "xxx";
    var oauth_consumer_key = "xxx";
    var oauth_token = "xxx";

    var nonce = oauth.nonce(32);
    var ts = Math.floor(new Date().getTime() / 1000);
    var timestamp = ts.toString();

    var accessor = {
        consumerSecret: consumerSecret,
        tokenSecret: tokenSecret
    };
    var params = {
        oauth_version: "1.0",
        oauth_consumer_key: oauth_consumer_key,
        oauth_token: oauth_token,
        oauth_timestamp: timestamp,
        oauth_nonce: nonce,
        oauth_signature_method: "HMAC-SHA1"
    };
    var message = {
        method: "GET",
        action: urlLink,
        parameters: params
    };

    oauth.SignatureMethod.sign(message, accessor);

    var normPar = oauth.SignatureMethod.normalizeParameters(message.parameters);
    var baseString = oauth.SignatureMethod.getBaseString(message);
    var sig = oauth.getParameter(message.parameters, "oauth_signature") + "=";
    var encodedSig = oauth.percentEncode(sig);

    console.log(urlLink);

    var promise = new Parse.Promise();

    Parse.Cloud.httpRequest({
        method: "GET",
        url: urlLink,
        headers: {
           Authorization: 'OAuth oauth_consumer_key="'+oauth_consumer_key+'", oauth_nonce=' + nonce + ', oauth_signature=' + encodedSig + ', oauth_signature_method="HMAC-SHA1", oauth_timestamp=' + timestamp + ',oauth_token="'+oauth_token+'", oauth_version="1.0"'
        },
        success:function(httpReponse){

            var data = JSON.parse(httpReponse.text);
            nbTweets = data.statuses.length;

            //console.log(data.search_metadata);
           // console.log(nbTweets + count);

            if(nbTweets == 0){
                promise.resolve({count:count, lastID:lastID});
            }
            else if(data.search_metadata.next_results != null){
                if(isFirstPage){
                    lastID = data.statuses[0].id;
                }

                var p2 = Parse.Promise.as();
                p2 = p2.then(function(){
                    return getTweetsNumber(data.search_metadata.next_results , count+nbTweets, lastID, false);
                });

                Parse.Promise.when(p2).then(function(result){
                    promise.resolve(result);
                });
            }
            else{
                console.log("resolve");
                promise.resolve({count:count+ nbTweets, lastID:lastID});
            }
        },
        error: function(httpError){
            console.log(httpError);
            promise.reject(httpError.message);
        }
    });

    return promise;
}

function saveTerm(term){
    console.log("saveTerm :"+term);
    return getTerm(term).then(function(tag){
        return getTermParam(tag,"lastID").then(function(lastID){
            var params = "?q=%23"+tag+"&since_id="+lastID+"&count=100&result_type=recent";
            return getTweetsNumber(params, 0, lastID, true).then(function(result){
                console.log(tag+" -> count: "+result.count+"   lastID: "+result.lastID);

                return getTermObj(tag).then(function(votes){
                    votes.increment("count",result.count);
                    return votes.save({
                        lastID:result.lastID
                    }).then(function(){
                        if(term == "term1"){
                            return saveTerm("term2");
                        }
                        else{
                            return true;
                        }
                    })
                })
            })
        });
    })
}

function getTermsObj(){
    var promise = new Parse.Query("MonitoringTerms").first();
    getTermsObj = function(){ return promise; }
    return promise;
}

function getTerm(term){
    return getTermsObj().then(function(terms){
        return terms.get(term);
    });
}

function getTermObj(term){
    var promise = new Parse.Query(term).first();
    return promise;
}

function getTermParam(term, param){
    return getTermObj(term).then(function(votes){
        if(votes == undefined){
            var object = new Parse.Object(term);
            return object.save({
               lastID:0,
               count:0
             }).then(function(){
                return 0;
             })
        }else{
            return votes.get(param);
        }
    });
}


Parse.Cloud.job("twitterFeed", function(request, status) {
   Parse.Cloud.useMasterKey();

   var promise = Parse.Promise.as();

   promise = promise.then(function(){
        // return getTweetsNumber(params, 0, 0, true);
        return saveTerm("term1");
   })

   Parse.Promise.when(promise).then(function(result){
    status.success("Tweets saved");
   }, function (error){
    status.error("Tweets failed to update");
   })

});