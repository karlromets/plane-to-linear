# plane-to-linear

Migrate Plane issues to Linear through Linear's importer tool. This migrator takes in a CSV file with Plane issues and outputs a CSV file with Linear issues.

## Required fields by Linear importer

- `Title`
- `Description`
- `Priority`
- `Status`
- `Assignee`
- `Labels`

## How fields are mapped

| Plane field        | Linear field      |
| ------------------ | ----------------- |
| Name               | Title             |
| Description        | Issue description |
| State              | Status            |
| Start Date         | Started           |
| Target Date        | Due Date          |
| Priority           | Priority          |
| Created By         | Creator           |
| Assignee           | Assignee          |
| Labels             | Labels            |
| Cycle Name         | Cycle Name        |
| Cycle Start Date   | Cycle Start       |
| Cycle End Date     | Cycle End         |
| Module Name        |                   |
| Module Start Date  |                   |
| Module Target Date |                   |
| Created At         | Created           |
| Updated At         | Updated           |
| Completed At       | Completed         |
| Archived At        | Archived          |

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

```bash
# Install the importer
npm i --location=global @linear/import

# Install the migrator
npm i

# Run the migrator
node index.js --input plane.csv --output linear.csv --config config.json
```

