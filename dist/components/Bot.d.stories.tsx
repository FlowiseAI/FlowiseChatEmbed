import { ComponentStory, ComponentMeta } from '@storybook/react';
import React from 'react';

import { Bot } from './Bot.d';

export default {
  title: 'Components/Bot',
  component: Bot,
  args: {
	chatflowid: 'string',
	apiHost: 'string',
	chatflowConfig: 'any' as unknown as any,
	welcomeMessage: 'string',
	botMessage: 'any' as unknown as any,
	userMessage: 'any' as unknown as any,
	textInput: 'any' as unknown as any,
	poweredByTextColor: 'string',
	badgeBackgroundColor: 'string',
	fontSize: 123,
	class: 'string'
  },
} as ComponentMeta<typeof Bot>;

const Template: ComponentStory<typeof Bot> = (args) => (
  <Bot {...args} />
);

export const Story = Template.bind({});
Story.args = {};
