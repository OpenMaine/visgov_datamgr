


var app = angular.module('vbGuiApp', ['ui.bootstrap']);

app.controller('vbGuiCtrl', ['$scope', '$http', '$sce', '$rootScope', '$window', '$modal',
	function($scope, $http, $sce, $rootScope, $window, $modal){

		window.$scope = $scope;

		$scope.init = function(){
			$scope.getBudgetList();
			$scope.view = 'multi';
		}


		// NETWORKING
		$scope.loadDataSet = function(){
			$scope.synchDataset();
		}

		$scope.saveDataSet = function(){
			$scope.synchDataset($scope.dataSet);
		}

		$scope.synchDataset = function(payLoad){
			var req = {
				url : 'vizbud_api.php',
				method : 'POST',
				data: {
					api : "synchFile",
					budgetSlug : $scope.selectedBudget.slug,
					fileName : $scope.selectedSet.path
				}
			}

			$scope.openHash = false;
			if(payLoad) {
				if($scope.currentItem) $scope.openHash = $scope.currentItem.hash;
				req.data.newContents = angular.toJson(payLoad, true)
			}

			$http(req).then(function successCallback(response) {
				$scope.reset();
				$scope.dataSet = response.data;

				$scope.catHash = [];
				$scope.catHash.push({
					hash : $scope.dataSet.hash,
					key : $scope.dataSet.key
				});
				if($scope.dataSet.sub.length != 0){
					buildCatHash($scope.dataSet, '');
				}

			}, function errorCallback(response) {
				console.log("can't find data set")
			});
		}


		$scope.getBudgetList = function(){
			var req = {
				url : 'vizbud_api.php',
				method : 'POST',
				data: {
					api : "listBudgets"
				}
			}

			$http(req).then(function successCallback(response) {
				$scope.reset();
				$scope.budgetList = [];
				$.each(response.data, function(index, budget){
					$scope.budgetList.push({
						"slug" : budget.slug,
						"label" : budget.slug.replace('_', ' '),
						"schema" : budget.schema
					});
				})

				console.log($scope.budgetList);

				$scope.selectedBudget = $scope.budgetList[0];
				$scope.selectedSet = $scope.selectedBudget.schema.dataSetList[0];
				$scope.synchDataset();



			}, function errorCallback(response) {
				console.log("can't find data set")
			});
		}

		$scope.loadBudget = function(){
			$scope.selectedSet = $scope.selectedBudget.schema.dataSetList[0];
			$scope.synchDataset();
		}

		$scope.reset = function(){
			$scope.catHash = [];
			$scope.currentItem = false;
			$scope.treePosition = false;
			$scope.currentParentHash = false;
		}


		// UI
		$scope.openItem = function(item){
			$scope.currentItem = item;

			// toggle subnav
			var subnav = $('.sub_' + item.hash);
			if(subnav.css('display') == 'block'){
				subnav.slideUp();
			}
			else {
				subnav.slideDown();
			}


			$scope.subTotals = false;

			if(item.hash != $scope.dataSet.hash){
				$scope.treePosition = getTreePointer(item.hash);
				$scope.currentParentHash = $scope.treePosition.parent.hash;
			}

			$scope.calculateSubs();
		}

		$scope.changeView = function(){
			if($scope.view == 'single') $scope.view = 'multi';
			else $scope.view = 'single';
		}

		$scope.calculateSubs = function(){

			var item = $scope.currentItem;
			if(item.sub.length != 0){
				$scope.subTotals = {};
				for(var i = 0; i < item.sub.length; i++){
					var s = item.sub[i];
					for(var v = 0; v < s.values.length; v++){
						val = s.values[v];
						var year = val.year;
						var value = val.val;

						if(!(year in $scope.subTotals)) $scope.subTotals[year] = 0;
						$scope.subTotals[year] += parseFloat(value);
					}
				}
			}
		}

		$scope.deleteItem = function(item){
			$scope.treePosition.parent.sub.splice($scope.treePosition.pIndex, 1);
			$scope.currentItem = false;
		}

		$scope.addChild = function(item){
			var emptyCat = {
				descr : "",
				key : "New Category",
				src : "",
				sub : [],
				url : "",
				values : [],
				hash: createGUID(8)
			}
			for(var i = 0; i < $scope.selectedBudget.schema.activeYears.length; i++){
				emptyCat.values.push({
					year: $scope.selectedBudget.schema.activeYears[i],
					val : 0
				})
			}

			item.sub.push(emptyCat);
			$scope.calculateSubs();

			//$scope.openItem(item.sub[item.sub.length - 1]);
		}

		$scope.changeParent = function(){
			var newParentHash = document.getElementById('parentSelector').value;

			var newParent = getTreePointer(newParentHash);
			var newCat = angular.copy($scope.currentItem);

			$scope.deleteItem($scope.currentItem);

			newCat.hash = createGUID(8);

			var t= newParent.pointer.sub;
			t.push(newCat);
			buildCatHash($scope.dataSet, '');

			// var newCat = t[t.length - 1];
			// $scope.openItem(newCat);

			$scope.saveDataSet();
		}

		$scope.fixNumber = function(node){

			var negative = (node.val[0] == '-');
			node.val = Number(node.val.replace(/[^0-9\.]+/g,""));
			if(negative) node.val *= -1;
		}



		// AND AWAY WE GO!!!
		$scope.init();
	}
]);



function getTreePointer(hash){
	for(var i = 0; i < $scope.catHash.length; i++){
		var p = $scope.catHash[i];
		if(p.hash == hash) return p;
	}
}

function buildCatHash(parent, indent){
	indent += '--';

	for(var i = 0; i < parent.sub.length; i++){
		var pointer = parent.sub[i];

		$scope.catHash.push({
			key 	: indent + ' ' + pointer.key,
			hash 	: pointer.hash,
			parent  : parent,
			pIndex 	: i,
			pointer : pointer
		});

		if(pointer.sub.length != 0){
			buildCatHash(pointer, indent);
		}
	}
}



function createGUID(l){
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for( var i=0; i < l; i++ ) text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}
