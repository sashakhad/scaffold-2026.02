'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const topicSchema = z.object({
  topic: z.string().min(1, 'Topic title is required').max(200),
  description: z
    .string()
    .min(1, 'Please describe the matter for consultation')
    .max(2000),
  facts: z.string().max(2000).optional(),
});

type TopicFormData = z.infer<typeof topicSchema>;

type TopicFormProps = {
  onSubmit: (data: { topic: string; description: string; facts: string[] }) => void;
  isDisabled: boolean;
};

export function TopicForm({ onSubmit, isDisabled }: TopicFormProps) {
  const form = useForm<TopicFormData>({
    resolver: zodResolver(topicSchema),
    defaultValues: {
      topic: '',
      description: '',
      facts: '',
    },
  });

  function handleSubmit(values: TopicFormData) {
    const facts = values.facts
      ? values.facts
          .split('\n')
          .map((f) => f.trim())
          .filter(Boolean)
      : [];

    onSubmit({
      topic: values.topic,
      description: values.description,
      facts,
    });

    form.reset();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="topic"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Topic for Consultation</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Planning the community Naw-Rúz celebration"
                  disabled={isDisabled}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the matter in detail. What needs to be decided?"
                  rows={3}
                  disabled={isDisabled}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="facts"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Known Facts{' '}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="One fact per line. e.g.&#10;Budget available: $500&#10;Venue capacity: 80 people&#10;Date: March 20"
                  rows={3}
                  disabled={isDisabled}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isDisabled}>
          {isDisabled ? 'Consultation in Progress...' : 'Begin Consultation'}
        </Button>
      </form>
    </Form>
  );
}
