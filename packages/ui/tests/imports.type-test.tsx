import * as React from 'react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  cn,
  ScrollArea,
  Separator,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../src';

const className = cn('base', false && 'hidden');

export const SharedImports = () => (
  <TooltipProvider>
    <Card className={className}>
      <CardContent>
        <Badge>Ready</Badge>
        <Button type="button">Save</Button>
        <Separator />
        <ScrollArea>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell>Value</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </ScrollArea>
        <Tabs defaultValue="one">
          <TabsList>
            <TabsTrigger value="one">One</TabsTrigger>
          </TabsList>
          <TabsContent value="one">Content</TabsContent>
        </Tabs>
        <Tooltip>
          <TooltipTrigger>Hover</TooltipTrigger>
          <TooltipContent>Tip</TooltipContent>
        </Tooltip>
      </CardContent>
    </Card>
  </TooltipProvider>
);
