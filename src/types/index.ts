export interface Subscription {
  Id: string;
  Name: string;
  Total_Licensed_Seats__c: number | null;
  Num_Active_Users_L30D__c: number | null;
  Account__c: string;
  Account_Name: string;
  Account_Company_Logo_URL: string | null;
  Account_SWE_Count: number | null;
  Account_NumberOfEmployees: number | null;
  Account_Technical_Account_Manager: string | null;
  Account_OwnerId: string | null;
  Account_Owner_ManagerId: string | null;
  Account_Technical_Account_Manager_ManagerId: string | null;
  Open_Renewal_Id: string | null;
  Open_Renewal_Opportunity_Owner: string | null;
  Open_Renewal_CloseDate: string | null;
  Open_Renewal_IsClosed: boolean | null;
  Open_Renewal_IsWon: boolean | null;
  Open_Renewal_Renewal_Target_Close_Date: string | null;
  Open_Renewal_Opportunity_Team: string | null;
  Open_Renewal_Renewal_Manager: string | null;
  Open_Renewal_Originating_Opportunity: string | null;
  Open_Renewal_Time_to_Renewal_Days: number | null;
  All_Cursor_Team_IDs__c: string | null;
}

export interface MAUGrowthData {
  month: string;
  MAUs: number;
}

export interface ModelSpendData {
  month: string;
  cursor_team_id: string;
  subscription_id: string;
  account_id: string;
  standardized_model: string;
  standardized_model_clean: string;
  model_family: string;
  total_requests: number;
  api_cost_usd_month: number;
  cursor_token_fee_calc_usd_month: number;
  total_usage_revenue_tokens_usd_month: number;
}

export interface TrueUpData {
  Id: string;
  Name: string;
  CloseDate: string;
  Subtype__c: string;
  True_Up_Number__c: number | null;
  Amount: number | null;
  License_Count__c: number | null;
}

export interface ActiveUsersTrendData {
  date: string;
  daily_active_users: number;
  weekly_active_users: number;
  monthly_active_users: number;
  power_users: number;
}

export interface FeatureAdoptionData {
  week_start: string;
  rule_users: number;
  mcp_users: number;
}

export interface FeatureAdoptionPercentageData {
  week_start: string;
  total_licensed_seats: number;
  weekly_active_users: number;
  rules_users: number;
  mcp_users: number;
  plan_mode_users: number;
  agent_users: number;
  commands_users: number;
  rules_pct: number;
  mcp_pct: number;
  plan_mode_pct: number;
  agent_pct: number;
  commands_pct: number;
  wau_pct: number;
  rules_pct_of_wau: number;
  mcp_pct_of_wau: number;
  plan_mode_pct_of_wau: number;
  agent_pct_of_wau: number;
  commands_pct_of_wau: number;
}

export interface TopUserData {
  email: string;
  agent_requests: number;
  ai_lines: number;
  tab_lines: number;
  uses_rules: boolean;
  uses_mcp: boolean;
  uses_links: boolean;
}

export interface MonthlySpendData {
  month: string;
  api_cost_usd_month: number;
  cursor_token_fee_calc_usd_month: number;
  total_spend_usd_month: number;
}

export interface OverageSpendData {
  month: string;
  amount: number;
}

export interface DepthOfUsageData {
  request_bucket: string;
  month: string;
  month_name: string;
  user_count: number;
}

export interface EnterpriseTeam {
  team_id: number;
  team_name: string;
  display_name: string;
  seats: number;
  membership_type: string;
  sf_account_name: string | null;
}

export interface AccountSearchResult {
  Id: string;
  Name: string;
  Industry: string | null;
  NumberOfEmployees: number | null;
}

export interface AccountOpportunity {
  Id: string;
  Name: string;
  StageName: string;
  CloseDate: string;
  Amount: number | null;
  Type: string | null;
  IsClosed: boolean;
  IsWon: boolean;
}
