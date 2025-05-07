# plane-to-linear

Migrate Plane issues to Linear through Linear's importer tool. This migrator takes in a CSV file with Plane issues and outputs a CSV file with Linear issues.

## Missing functionality

- Projects don't seem to be created when importing. This is weird since when importing from Jira, the importer creates the projects.

## Required fields by Linear importer

- `Title`
- `Description`
- `Priority`
- `Status`
- `Assignee`
- `Labels`

## How fields are mapped

| Plane field        | Linear field |
| ------------------ | ------------ |
| Name               | Title        |
| Description        | Description  |
| State              | Status       |
| Start Date         | Started      |
| Target Date        | Due Date     |
| Priority           | Priority     |
| Created By         | Creator      |
| Assignee           | Assignee     |
| Labels             | Labels       |
| Cycle Name         | Cycle Name   |
| Cycle Start Date   | Cycle Start  |
| Cycle End Date     | Cycle End    |
| Module Name        |              |
| Module Start Date  |              |
| Module Target Date |              |
| Created At         | Created      |
| Updated At         | Updated      |
| Completed At       | Completed    |
| Archived At        | Archived     |

There doesn't seem to be a direct mapping for modules. Linear has Milestones, but neither these, nor Roadmaps, nor issues with sub-issues are direct equivalents. Linear Projects offer the closest conceptual match, but are unsuitable here as Plane Projects already map to Linear Projects.

## Config file

The config file is a JSON file that maps Plane user names to Linear emails.

I noticed that Plane uses full names for users, while Linear uses emails.

You can leave the config file empty if you don't want to map those, but if you do, this is the format:

```json
{
  "users": {
    "Michael Angel": "michael@angel.com"
  }
}
```

## Usage

1 - Grab your Plane CSV file from `https://app.plane.so/your-org-here/settings/exports/`

   > Note: Plane will only export issues for projects you are a member of. Meaning, if you want to export issues from all projects, you need to be a member of all projects.

2 - Grab your Linear API key from [https://linear.app/settings/account/security](https://linear.app/settings/account/security)

3 - To the terminal:

```bash
# Install the importer
npm i --location=global @linear/import

# Install the migrator
npm i

# Run the migrator
node index.js --input plane.csv --output linear.csv --config config.json

# Run the importer
linear-import
# ? Input your Linear API key (https://linear.app/settings/account/security) api_key_here
# ? Which service would you like to import from? Linear (CSV export)
# ? Select your exported CSV file of Linear issues linear.csv
# ? Do you want to create a new team for imported issues? Yes/No
# ? Import into team: [TIM] TIMS TEAM
# ? Do you want to assign these issues to yourself? Yes/No
#  ████████████████████████████████████████ 100% | ETA: 0s | 100/100
```
