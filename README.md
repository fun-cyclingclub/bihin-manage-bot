# bihin-manage-bot

slackでスプレッドシートの中身を利用して備品管理できるbotです。

item_id, item, available, loan_date, account, nameをスプレッドシート1行目にそれぞれ列に記述してください。

container bound scriptでのみ動作します。Normal scriptで動作させる場合は

>> ss.getActiveSheet();

を書き換えてください。
