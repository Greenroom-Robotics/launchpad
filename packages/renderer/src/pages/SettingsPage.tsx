
import { Box } from 'grommet'
import { Header } from '../components/layout/Header'
import { SchemaForm } from '@greenroom-robotics/alpha.schema-form'

export const SettingsPage = () => {
  return (
    <Box fill>
      <Header title="Settings" />
      <Box direction="row" margin={{ horizontal: "medium", bottom: "medium" }} gap="medium">
        <SchemaForm schema={{
                type: "object",
                properties: {
                    username: { type: "string", title: "Username" },
                    email: { type: "string", format: "email", title: "Email" },
                    notifications: { type: "boolean", title: "Enable Notifications" },
                },
                required: ["username", "email"],
            }}
            onSubmit={(data) => {
                console.log("Form submitted:", data);
            }}
        />
    </Box>

    </Box>
  )
}
