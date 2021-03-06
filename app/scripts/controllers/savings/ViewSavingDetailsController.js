(function (module) {
    mifosX.controllers = _.extend(module, {
        ViewSavingDetailsController: function (scope, routeParams, resourceFactory, location, $modal, route, dateFilter, $sce, $rootScope, API_VERSION) {
            scope.report = false;
            scope.hidePentahoReport = true;
            scope.showActiveCharges = true;
            scope.formData = {};
            scope.date = {};
            scope.staffData = {};
            scope.fieldOfficers = [];
            scope.isDebit = function (savingsTransactionType) {
                return savingsTransactionType.withdrawal == true || savingsTransactionType.feeDeduction == true;
            };

            scope.routeTo = function (savingsAccountId, transactionId, accountTransfer, transferId) {
                if (accountTransfer) {
                    location.path('/viewaccounttransfers/' + transferId);
                } else {
                    location.path('/viewsavingtrxn/' + savingsAccountId + '/trxnId/' + transactionId);
                }
            };

            /***
             * we are using orderBy(https://docs.angularjs.org/api/ng/filter/orderBy) filter to sort fields in ui
             * api returns dates in array format[yyyy, mm, dd], converting the array of dates to date object
             * @param dateFieldName
             */
            scope.convertDateArrayToObject = function(dateFieldName){
                for(var i in scope.savingaccountdetails.transactions){
                    scope.savingaccountdetails.transactions[i][dateFieldName] = new Date(scope.savingaccountdetails.transactions[i].date);
                }
            };
            scope.isRecurringCharge = function (charge) {
                return charge.chargeTimeType.value == 'Monthly Fee' || charge.chargeTimeType.value == 'Annual Fee' || charge.chargeTimeType.value == 'Weekly Fee';
            }

            scope.viewCharge = function (id){
                location.path('/savings/'+scope.savingaccountdetails.id+'/viewcharge/'+id).search({'status':scope.savingaccountdetails.status.value});
            }

            scope.clickEvent = function (eventName, accountId) {
                eventName = eventName || "";
                switch (eventName) {
                    case "modifyapplication":
                        location.path('/editsavingaccount/' + accountId);
                        break;
                    case "approve":
                        location.path('/savingaccount/' + accountId + '/approve');
                        break;
                    case "reject":
                        location.path('/savingaccount/' + accountId + '/reject');
                        break;
                    case "withdrawnbyclient":
                        location.path('/savingaccount/' + accountId + '/withdrawnByApplicant');
                        break;
                    case "delete":
                        resourceFactory.savingsResource.delete({accountId: accountId}, {}, function (data) {
                            var destination = '/viewgroup/' + data.groupId;
                            if (data.clientId) destination = '/viewclient/' + data.clientId;
                            location.path(destination);
                        });
                        break;
                    case "undoapproval":
                        location.path('/savingaccount/' + accountId + '/undoapproval');
                        break;
                    case "activate":
                        location.path('/savingaccount/' + accountId + '/activate');
                        break;
                    case "deposit":
                        location.path('/savingaccount/' + accountId + '/deposit');
                        break;
                    case "withdraw":
                        location.path('/savingaccount/' + accountId + '/withdrawal');
                        break;
                    case "addcharge":
                        location.path('/savingaccounts/' + accountId + '/charges');
                        break;
                    case "calculateInterest":
                        resourceFactory.savingsResource.save({accountId: accountId, command: 'calculateInterest'}, {}, function (data) {
                            route.reload();
                        });
                        break;
                    case "postInterest":
                        resourceFactory.savingsResource.save({accountId: accountId, command: 'postInterest'}, {}, function (data) {
                            route.reload();
                        });
                        break;
                    case "applyAnnualFees":
                        location.path('/savingaccountcharge/' + accountId + '/applyAnnualFees/' + scope.annualChargeId);
                        break;
                    case "transferFunds":
                        if (scope.savingaccountdetails.clientId) {
                            location.path('/accounttransfers/fromsavings/' + accountId);
                        }
                        break;
                    case "close":
                        location.path('/savingaccount/' + accountId + '/close');
                        break;
                    case "assignSavingsOfficer":
                        location.path('/assignsavingsofficer/' + accountId);
                        break;
                    case "unAssignSavingsOfficer":
                        location.path('/unassignsavingsofficer/' + accountId);
                        break;

                }
            };

            resourceFactory.savingsResource.get({accountId: routeParams.id, associations: 'all'}, function (data) {
                scope.savingaccountdetails = data;
                scope.staffData.staffId = data.staffId;
                scope.date.toDate = new Date();
                scope.date.fromDate = new Date(data.timeline.activatedOnDate);
                scope.status = data.status.value;
                if (scope.status == "Submitted and pending approval" || scope.status == "Active" || scope.status == "Approved") {
                    scope.choice = true;
                }
                scope.chargeAction = data.status.value == "Submitted and pending approval" ? true : false;
                scope.chargePayAction = data.status.value == "Active" ? true : false;
                if (scope.savingaccountdetails.charges) {
                    scope.charges = scope.savingaccountdetails.charges;
                    scope.chargeTableShow = true;
                } else {
                    scope.chargeTableShow = false;
                }
                if (data.status.value == "Submitted and pending approval") {
                    scope.buttons = { singlebuttons: [
                        {
                            name: "button.modifyapplication",
                            icon: "icon-pencil ",
                            taskPermissionName:"UPDATE_SAVINGSACCOUNT"
                        },
                        {
                            name: "button.approve",
                            icon: "icon-ok-sign",
                            taskPermissionName:"APPROVE_SAVINGSACCOUNT"
                        }
                    ],
                        options: [
                            {
                                name: "button.reject",
                                taskPermissionName:"REJECT_SAVINGSACCOUNT"
                            },
                            {
                                name: "button.withdrawnbyclient",
                                taskPermissionName:"WITHDRAW_SAVINGSACCOUNT"
                            },
                            {
                                name: "button.addcharge",
                                taskPermissionName:"CREATE_SAVINGSACCOUNTCHARGE"
                            },
                            {
                                name: "button.delete",
                                taskPermissionName:"DELETE_SAVINGSACCOUNT"
                            }
                        ]
                    };
                }

                if (data.status.value == "Approved") {
                    scope.buttons = { singlebuttons: [
                        {
                            name: "button.undoapproval",
                            icon: "icon-undo",
                            taskPermissionName:"APPROVALUNDO_SAVINGSACCOUNT"
                        },
                        {
                            name: "button.activate",
                            icon: "icon-ok-sign",
                            taskPermissionName:"ACTIVATE_SAVINGSACCOUNT"
                        },
                        {
                            name: "button.addcharge",
                            icon: "icon-plus",
                            taskPermissionName:"CREATE_SAVINGSACCOUNTCHARGE"
                        }
                    ]
                    };
                }

                if (data.status.value == "Active") {
                    scope.buttons = { singlebuttons: [
                        {
                            name: "button.deposit",
                            icon: "icon-arrow-right",
                            taskPermissionName:"DEPOSIT_SAVINGSACCOUNT"
                        },
                        {
                            name: "button.withdraw",
                            icon: "icon-arrow-left",
                            taskPermissionName:"WITHDRAW_SAVINGSACCOUNT"
                        },
                        {
                            name: "button.calculateInterest",
                            icon: "icon-table",
                            taskPermissionName:"CALCULATEINTEREST_SAVINGSACCOUNT"
                        }
                    ],
                        options: [
                            {
                                name: "button.postInterest",
                                taskPermissionName:"POSTINTEREST_SAVINGSACCOUNT"
                            },
                            {
                                name: "button.addcharge",
                                taskPermissionName:"CREATE_SAVINGSACCOUNTCHARGE"
                            },
                            {
                                name: "button.close",
                                taskPermissionName:"CLOSE_SAVINGSACCOUNT"
                            }
                        ]

                    };
                    if (data.clientId) {
                        scope.buttons.options.push({
                            name: "button.transferFunds",
                            taskPermissionName:"CREATE_ACCOUNTTRANSFER"
                        });
                    }
                    if (data.charges) {
                        for (var i in scope.charges) {
                            if (scope.charges[i].name == "Annual fee - INR") {
                                scope.buttons.options.push({
                                    name: "button.applyAnnualFees",
                                    taskPermissionName:"APPLYANNUALFEE_SAVINGSACCOUNT"
                                });
                                scope.annualChargeId = scope.charges[i].id;
                            }
                        }
                    }
                }
                if (data.annualFee) {
                    var annualdueDate = [];
                    annualdueDate = data.annualFee.feeOnMonthDay;
                    annualdueDate.push(new Date().getFullYear());
                    scope.annualdueDate = new Date(annualdueDate);
                };
            });

            resourceFactory.DataTablesResource.getAllDataTables({apptable: 'm_savings_account'}, function (data) {
                scope.savingdatatables = data;
            });
            /*// Saving notes not yet implemented
            resourceFactory.savingsResource.getAllNotes({accountId: routeParams.id,resourceType:'notes'}, function (data) {
                scope.savingNotes = data;
            });

            scope.saveNote = function () {
                resourceFactory.savingsResource.save({accountId: routeParams.id, resourceType: 'notes'}, this.formData, function (data) {
                    var today = new Date();
                    temp = { id: data.resourceId, note: scope.formData.note, createdByUsername: "test", createdOn: today };
                    scope.savingNotes.push(temp);
                    scope.formData.note = "";
                    scope.predicate = '-id';
                });
            };*/

            scope.dataTableChange = function (datatable) {
                resourceFactory.DataTablesResource.getTableDetails({datatablename: datatable.registeredTableName,
                    entityId: routeParams.id, genericResultSet: 'true'}, function (data) {
                    scope.datatabledetails = data;
                    scope.datatabledetails.isData = data.data.length > 0 ? true : false;
                    scope.datatabledetails.isMultirow = data.columnHeaders[0].columnName == "id" ? true : false;
                    scope.showDataTableAddButton = !scope.datatabledetails.isData || scope.datatabledetails.isMultirow;
                    scope.showDataTableEditButton = scope.datatabledetails.isData && !scope.datatabledetails.isMultirow;
                    scope.singleRow = [];
                    for (var i in data.columnHeaders) {
                        if (scope.datatabledetails.columnHeaders[i].columnCode) {
                            for (var j in scope.datatabledetails.columnHeaders[i].columnValues) {
                                for (var k in data.data) {
                                    if (data.data[k].row[i] == scope.datatabledetails.columnHeaders[i].columnValues[j].id) {
                                        data.data[k].row[i] = scope.datatabledetails.columnHeaders[i].columnValues[j].value;
                                    }
                                }
                            }
                        }
                    }
                    if (scope.datatabledetails.isData) {
                        for (var i in data.columnHeaders) {
                            if (!scope.datatabledetails.isMultirow) {
                                var row = {};
                                row.key = data.columnHeaders[i].columnName;
                                row.value = data.data[0].row[i];
                                scope.singleRow.push(row);
                            }
                        }
                    }
                });
            };

            scope.export = function () {
                scope.report = true;
                scope.printbtn = false;
            };

            scope.viewDataTable = function (registeredTableName,data){
                if (scope.datatabledetails.isMultirow) {
                    location.path("/viewdatatableentry/"+registeredTableName+"/"+scope.savingaccountdetails.id+"/"+data.row[0]);
                }else{
                    location.path("/viewsingledatatableentry/"+registeredTableName+"/"+scope.savingaccountdetails.id);
                }
            };

            scope.viewSavingDetails = function () {
                scope.report = false;
            };



            scope.viewprintdetails = function () {
                scope.printbtn = true;
                scope.hidePentahoReport = true;
                scope.formData.outputType = 'HTML';
                scope.baseURL = $rootScope.hostUrl + API_VERSION + "/runreports/" + encodeURIComponent("Client Saving Transactions");
                scope.baseURL += "?output-type=" + encodeURIComponent(scope.formData.outputType) + "&tenantIdentifier=" + $rootScope.tenantIdentifier+"&locale="+scope.optlang.code;

                var reportParams = "";
                scope.startDate = dateFilter(scope.date.fromDate, 'yyyy-MM-dd');
                scope.endDate = dateFilter(scope.date.toDate, 'yyyy-MM-dd');
                var paramName = "R_startDate";
                reportParams += encodeURIComponent(paramName) + "=" + encodeURIComponent(scope.startDate)+ "&";
                paramName = "R_endDate";
                reportParams += encodeURIComponent(paramName) + "=" + encodeURIComponent(scope.endDate)+ "&";
                paramName = "R_savingsAccountId";
                reportParams += encodeURIComponent(paramName) + "=" + encodeURIComponent(scope.savingaccountdetails.accountNo);
                if (reportParams > "") {
                    scope.baseURL += "&" + reportParams;
                }
                // allow untrusted urls for iframe http://docs.angularjs.org/error/$sce/insecurl
                scope.baseURL = $sce.trustAsResourceUrl(scope.baseURL);
                
            };

            scope.printReport = function () {
                window.print();
                window.close();
            };

            scope.deleteAll = function (apptableName, entityId) {
                resourceFactory.DataTablesResource.delete({datatablename: apptableName, entityId: entityId, genericResultSet: 'true'}, {}, function (data) {
                    route.reload();
                });
            };

            scope.modifyTransaction = function (accountId, transactionId) {
                location.path('/savingaccount/' + accountId + '/modifytransaction?transactionId=' + transactionId);
            };

            scope.transactionSort = {
                column: 'date',
                descending: true
            };

            scope.changeTransactionSort = function(column) {
                var sort = scope.transactionSort;
                if (sort.column == column) {
                    sort.descending = !sort.descending;
                } else {
                    sort.column = column;
                    sort.descending = true;
                }
            };
            
        }
    });
    mifosX.ng.application.controller('ViewSavingDetailsController', ['$scope', '$routeParams', 'ResourceFactory', '$location','$modal', '$route', 'dateFilter', '$sce', '$rootScope', 'API_VERSION', mifosX.controllers.ViewSavingDetailsController]).run(function ($log) {
        $log.info("ViewSavingDetailsController initialized");
    });
}(mifosX.controllers || {}));
