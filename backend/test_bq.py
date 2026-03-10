from google.cloud import bigquery
client = bigquery.Client(project="bill-sandpit")
query = 'SELECT * FROM `dan-sandpit.hawks_idp.players` LIMIT 1'
job = client.query(query)
for row in job:
    print(list(dict(row).keys()))
