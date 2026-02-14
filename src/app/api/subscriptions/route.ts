import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/databricks';
import type { Subscription } from '@/types';

export async function GET() {
  try {
    const query = `
      SELECT
        s.Id, s.Name, s.Total_Licensed_Seats__c, s.Num_Active_Users_L30D__c,
        s.All_Cursor_Team_IDs__c,
        s.Account__c, a.Name AS Account_Name,
        a.Company_Logo_URL__c AS Account_Company_Logo_URL,
        a.SWE_Count__c AS Account_SWE_Count,
        a.NumberofEmployees AS Account_NumberOfEmployees,
        a.Technical_Account_Manager__c AS Account_Technical_Account_Manager,
        a.OwnerId AS Account_OwnerId,
        owner.ManagerId AS Account_Owner_ManagerId,
        tam.ManagerId AS Account_Technical_Account_Manager_ManagerId,
        opp.Id AS Open_Renewal_Id,
        opp.Opportunity_Owner__c AS Open_Renewal_Opportunity_Owner,
        opp.CloseDate AS Open_Renewal_CloseDate,
        opp.IsClosed AS Open_Renewal_IsClosed,
        opp.IsWon AS Open_Renewal_IsWon,
        opp.Renewal_Target_Close_Date__c AS Open_Renewal_Renewal_Target_Close_Date,
        opp.Opportunity_Team__c AS Open_Renewal_Opportunity_Team,
        opp.Renewal_Manager__c AS Open_Renewal_Renewal_Manager,
        opp.Originating_Opportunity__c AS Open_Renewal_Originating_Opportunity,
        opp.Time_to_Renewal_Days__c AS Open_Renewal_Time_to_Renewal_Days
      FROM revops_share.pt_salesforce.subscription__c s
      LEFT JOIN revops_share.pt_salesforce.account a ON s.Account__c = a.Id
      LEFT JOIN revops_share.pt_salesforce.user owner ON a.OwnerId = owner.Id
      LEFT JOIN revops_share.pt_salesforce.user tam ON a.Technical_Account_Manager__c = tam.Id
      LEFT JOIN revops_share.pt_salesforce.opportunity opp ON s.Open_Renewal__c = opp.Id
      LEFT JOIN revops_share.pt_salesforce.account opp_acct ON opp.AccountId = opp_acct.Id
      WHERE s.All_Cursor_Team_IDs__c IS NOT NULL
      ORDER BY opp.Renewal_Baseline_ARR__c DESC NULLS LAST
    `;
    const data = await executeQuery<Subscription>(query);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
