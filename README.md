# parse-cloud-monitoringtweet

This code will help you to count numbers of tweet for differents hashtags or tweets sents to people, on parse.com it's really usefull for a vote system!

# Configuring your parse project

1- Create an account on http://www.parse.com

2- Create a new project and follow instructions.

3- Create a new parse object named BotTerms with 1 array properties named tags, you can fill this array with tag (without # or with people with @)

eg. You want to track every tags #mercedesbenz and want also to track every tweet sent to a specific person like @notiles, the array tags in class BotTerms will look like that : ["mercedesbenz", "@notiles"]

# Configuring the main.js file

1- Configure main.js with your twitter credentials on lines 7 to 10.

```js
var consumerSecret = "xxx";
var tokenSecret = "xxx";
var oauth_consumer_key = "xxx";
var oauth_token = "xxx";
```

# Deploy and launch monitoring on parse.com

1- Deploy (parse.deploy) files in cloudcode folder to your cloudcode on parse.com

https://parse.com/docs/cloudcode/guide#command-line

2- Launch a new background job and schedule the twitterFeed job every 3 minutes.

https://parse.com/docs/cloudcode/guide#cloud-code-advanced-background-jobs