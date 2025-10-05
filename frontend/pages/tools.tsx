import Layout from '../components/Layout'
import { Card } from '../components/ui/Card'
import Button from '../components/ui/Button'

export default function Tools() {
  return (
    <Layout>
      <Card className="p-4">
        <h2 className="text-xl font-semibold mb-4">Tools</h2>
        <div className="flex flex-col gap-2">
          <Button variant="ghost">Enable Notifications</Button>
          <Button variant="ghost">Logout</Button>
        </div>
      </Card>
    </Layout>
  )
}
